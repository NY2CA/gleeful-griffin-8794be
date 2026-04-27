/**
 * Password hashing + JWT helpers.
 *   - bcryptjs for password hashing (pure JS, works in Netlify Functions runtime)
 *   - jose for JWT signing/verification (lightweight, ESM, web-standard crypto)
 *
 * JWT lives in the Authorization header: "Bearer <token>" when the client calls
 * protected endpoints (/api/auth/me, /api/progress/*).
 */

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const JWT_ISSUER = 'multifamily-mastery';
const JWT_AUDIENCE = 'mfm-platform';
const JWT_EXPIRES_IN = '7d';
const RESET_AUDIENCE = 'password-reset';
const RESET_EXPIRES_IN = '30m';

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 24) {
    throw new Error(
      'JWT_SECRET environment variable is missing or too short. ' +
        'Set a random 32+ character string in Netlify site env.'
    );
  }
  return new TextEncoder().encode(raw);
}

export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

export interface SessionClaims extends JWTPayload {
  sub: string; // user id
  email: string;
  name: string;
}

export async function signSession(claims: Omit<SessionClaims, 'iat' | 'exp' | 'iss' | 'aud'>): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload as SessionClaims;
  } catch {
    return null;
  }
}

/**
 * Reset-token claims. We include the first 24 chars of the current password
 * hash so that any outstanding reset link is invalidated the instant the
 * password changes (replay protection without tracking nonces server-side).
 */
export interface ResetClaims extends JWTPayload {
  sub: string;   // user id
  email: string;
  pwd: string;   // passwordHash prefix
}

export async function signResetToken(
  claims: Omit<ResetClaims, 'iat' | 'exp' | 'iss' | 'aud'>
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(RESET_AUDIENCE)
    .setExpirationTime(RESET_EXPIRES_IN)
    .sign(getSecret());
}

export async function verifyResetToken(token: string): Promise<ResetClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: JWT_ISSUER,
      audience: RESET_AUDIENCE,
    });
    return payload as ResetClaims;
  } catch {
    return null;
  }
}

/** Returns the hash fragment we embed in reset tokens. */
export function hashFingerprint(passwordHash: string): string {
  return (passwordHash || '').slice(0, 24);
}

/**
 * Reads the bearer token from a Request, verifies it, and returns the claims
 * or null. Functions that require auth should short-circuit with a 401 if
 * this returns null.
 */
export async function requireSession(req: Request): Promise<SessionClaims | null> {
  const header = req.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return verifySession(match[1]);
}

/**
 * Normalizes an email address so lookups are consistent.
 */
export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Generates a stable user id from an email. We use a base36 timestamp + random
 * suffix at signup, and persist it on the user record. Clients never see the
 * email → id mapping.
 */
export function newUserId(): string {
  return (
    'u_' +
    Date.now().toString(36) +
    '_' +
    Math.random().toString(36).slice(2, 8)
  );
}
