/**
 * Tiny fetch wrapper for the Netlify Functions backend.
 * - Attaches the bearer token from localStorage automatically.
 * - Throws an Error with the server-provided `error` message on non-2xx.
 *
 * Set NEXT_PUBLIC_API_BASE in .env.local to point at a different origin during
 * development (default is '' which resolves to the same origin the page is on).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
const TOKEN_KEY = 'mfm_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

interface ApiOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  /** When true, the request is sent without the auth header. */
  anonymous?: boolean;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, anonymous } = opts;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (!anonymous) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? safeParse(text) : null;

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data && (data as any).error) ||
      `Request failed (${res.status})`;
    throw new ApiError(String(message), res.status);
  }
  return data as T;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
