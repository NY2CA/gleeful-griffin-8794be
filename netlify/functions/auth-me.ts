import type { Config } from '@netlify/functions';
import { requireSession } from './_lib/auth';
import { json, error, handleOptions } from './_lib/response';

export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return error('Method not allowed', 405);

  const claims = await requireSession(req);
  if (!claims) return error('Unauthorized', 401);

  return json({
    user: {
      id: claims.sub,
      email: claims.email,
      name: claims.name,
    },
  });
};

export const config: Config = {
  path: '/api/auth/me',
};
