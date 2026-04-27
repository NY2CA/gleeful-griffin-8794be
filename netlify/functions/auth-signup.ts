import type { Config } from '@netlify/functions';
import {
  hashPassword,
  signSession,
  normalizeEmail,
  isValidEmail,
  newUserId,
} from './_lib/auth';
import { getUserByEmail, saveUser } from './_lib/store';
import { json, error, parseJsonBody, handleOptions } from './_lib/response';

interface SignupBody {
  name?: string;
  email?: string;
  password?: string;
}

export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return error('Method not allowed', 405);

  let body: SignupBody;
  try {
    body = await parseJsonBody<SignupBody>(req);
  } catch {
    return error('Invalid JSON body', 400);
  }

  const name = (body.name || '').trim();
  const email = normalizeEmail(body.email || '');
  const password = body.password || '';

  if (!name) return error('Name is required', 400);
  if (!email || !isValidEmail(email)) return error('Valid email is required', 400);
  if (password.length < 8) return error('Password must be at least 8 characters', 400);

  try {
    const existing = await getUserByEmail(email);
    if (existing) return error('An account with that email already exists', 409);

    const passwordHash = await hashPassword(password);
    const user = {
      id: newUserId(),
      email,
      name,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    await saveUser(user);

    const token = await signSession({ sub: user.id, email: user.email, name: user.name });
    return json(
      {
        token,
        user: { id: user.id, email: user.email, name: user.name },
      },
      201
    );
  } catch (err) {
    console.error('[auth-signup] error', err);
    return error('Unable to create account', 500);
  }
};

export const config: Config = {
  path: '/api/auth/signup',
};
