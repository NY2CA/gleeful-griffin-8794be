import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { api, ApiError, getToken, setToken } from '@/lib/api';

/**
 * The active Deal record returned alongside the User from /api/auth/me.
 * Mirrors the server-side `Deal` interface in `_lib/store.ts` so the
 * dashboard can render real per-user deal data on the "Your deal" card.
 *
 * `null` when the member has no live deals (not yet submitted, or all
 * deals are closed). The dashboard renders the empty state in that case.
 */
export interface ActiveDeal {
  id: string;
  submittedAt: string;
  updatedAt: string;
  status: 'submitted' | 'in_review' | 'active' | 'on_hold' | 'closed_won' | 'closed_lost';
  name: string;
  address?: string;
  units?: number;
  assetClass?: string;
  askingPrice?: number;
  underwrittenNoi?: number;
  underwrittenYoc?: string;
  targetIrr?: string;
  stage?: string;
  coachingFocus?: string;
  reviewNotes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  /** True when the email is in the server-side ADMIN_EMAILS env var. */
  isAdmin?: boolean;
  /**
   * Wave 14.3 · every live deal on the user record (submitted, in_review,
   * active, on_hold), sorted most-recently-updated first. Empty array if
   * the member has no live deals. Closed deals are excluded. Surfaced on
   * the dashboard's "Your deals" stack.
   */
  activeDeals?: ActiveDeal[];
  /**
   * Backward-compat shim for the Wave 14.1 single-deal field. Always equals
   * `activeDeals[0] ?? null` on a Wave 14.3+ server. New code should read
   * `activeDeals[]` directly.
   */
  activeDeal?: ActiveDeal | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Set the user + token directly. Used after password reset auto sign-in. */
  setSession: (token: string, user: User) => void;
}

interface AuthResponse {
  token: string;
  user: User;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, if a token exists, verify it against /api/auth/me. If the token
  // is invalid or expired, silently clear it.
  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api<{ user: User }>('/api/auth/me');
        setUser(data.user);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setToken(null);
        } else {
          // Network blip — keep the cached token, don't sign the user out.
          console.warn('[auth] /me failed', err);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    if (!email || !password) throw new Error('Email and password are required');
    const data = await api<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      anonymous: true,
    });
    setToken(data.token);
    setUser(data.user);
  }

  async function signup(name: string, email: string, password: string) {
    if (!name || !email || !password) throw new Error('All fields are required');
    if (password.length < 8) throw new Error('Password must be at least 8 characters');
    const data = await api<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: { name, email, password },
      anonymous: true,
    });
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  function setSession(token: string, nextUser: User) {
    setToken(token);
    setUser(nextUser);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
