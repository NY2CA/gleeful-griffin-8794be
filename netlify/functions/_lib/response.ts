/**
 * Shared response helpers for Netlify Functions v2.
 * Every function returns JSON. CORS is permissive by default since we're
 * same-origin on Netlify; tighten the allowed origin in production if you
 * ever call these from a different domain.
 */

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Max-Age': '600',
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...CORS,
    },
  });
}

export function error(message: string, status = 400, details?: unknown): Response {
  return json({ error: message, details }, status);
}

export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

export async function parseJsonBody<T = unknown>(req: Request): Promise<T> {
  const text = await req.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Invalid JSON body');
  }
}
