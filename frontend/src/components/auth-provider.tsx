"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, AUTH_INVALIDATED_EVENT } from "@/lib/api";
import type {
  AuthSession,
  AuthUser,
  LoginPayload,
  RegisterReporterPayload,
} from "@/lib/types";

type AuthContextValue = {
  isReady: boolean;
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (payload: LoginPayload) => Promise<AuthSession>;
  registerReporter: (payload: RegisterReporterPayload) => Promise<AuthSession>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const STORAGE_KEY = "kpk-wbs-session";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);

    return null;
  }
}

function persistSession(session: AuthSession | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);

    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const session = readStoredSession();

      if (!session) {
        if (active) {
          setIsReady(true);
        }

        return;
      }

      if (active) {
        setToken(session.token);
        setUser(session.user);
      }

      try {
        const profile = await api.fetchMe(session.token);

        if (!active) {
          return;
        }

        const nextSession = {
          token: session.token,
          user: profile.user,
        };

        setToken(nextSession.token);
        setUser(nextSession.user);
        persistSession(nextSession);
      } catch {
        if (!active) {
          return;
        }

        setToken(null);
        setUser(null);
        persistSession(null);
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleInvalidation = () => {
      setToken(null);
      setUser(null);
      persistSession(null);
      setIsReady(true);
    };

    window.addEventListener(AUTH_INVALIDATED_EVENT, handleInvalidation);

    return () => {
      window.removeEventListener(AUTH_INVALIDATED_EVENT, handleInvalidation);
    };
  }, []);

  const setSession = (session: AuthSession) => {
    setToken(session.token);
    setUser(session.user);
    persistSession(session);
  };

  const login = async (payload: LoginPayload) => {
    const session = await api.login(payload);
    setSession(session);

    return session;
  };

  const registerReporter = async (payload: RegisterReporterPayload) => {
    const session = await api.registerReporter(payload);
    setSession(session);

    return session;
  };

  const logout = async () => {
    if (token) {
      try {
        await api.logout(token);
      } catch {
        // Local session must still be cleared if the backend session already expired.
      }
    }

    setToken(null);
    setUser(null);
    persistSession(null);
  };

  const refreshProfile = async () => {
    if (!token) {
      return;
    }

    const profile = await api.fetchMe(token);
    const nextSession = {
      token,
      user: profile.user,
    };

    setSession(nextSession);
  };

  const value: AuthContextValue = {
    isReady,
    isAuthenticated: Boolean(token && user),
    token,
    user,
    login,
    registerReporter,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
