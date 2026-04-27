import type { Config } from '@netlify/functions';
import { verifyPassword, signSession, normalizeEmail, isValidEmail } from './_lib/auth';
import { getUserByEmail } from './_lib/store';
import { json, error, parseJsonBody, handleOptions } from './_lib/response';

interface LoginBody {
  email?: string;
  password?: string;
}

export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return error('Method not allowed', 405);

  let body: LoginBody;
  try {
    body = await parseJsonBody<LoginBody>(req);
  } catch {
    return error('Invalid JSON body', 400);
  }

  const email = normalizeEmail(body.email || '');
  const password = body.password || '';
  if (!email || !isValidEmail(email)) return error('Valid email is required', 400);
  if (!password) return error('Password is required', 400);

  try {
    const user = await getUserByEmail(email);
    // Always return a uniform "invalid credentials" error — don't leak whether
    // the email is registered.
    if (!user) return error('Invalid email or password', 401);

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return error('Invalid email or password', 401);

    const token = await signSession({ sub: user.id, email: user.email, name: user.name });
    return json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error('[auth-login] error', err);
    return error('Unable to sign in', 500);
  }
};

export const config: Config = {
  path: '/api/auth/login',
};
