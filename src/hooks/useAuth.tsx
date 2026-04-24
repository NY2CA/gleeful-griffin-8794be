import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { api, ApiError, getToken, setToken } from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
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
