"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  api,
  AUTH_INVALIDATED_EVENT,
  FRONTEND_SESSION_MARKER,
} from "@/lib/api";
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

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const profile = await api.fetchMe(FRONTEND_SESSION_MARKER);

        if (!active) {
          return;
        }

        setToken(FRONTEND_SESSION_MARKER);
        setUser(profile.user);
      } catch {
        if (!active) {
          return;
        }

        setToken(null);
        setUser(null);
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
      setIsReady(true);
    };

    window.addEventListener(AUTH_INVALIDATED_EVENT, handleInvalidation);

    return () => {
      window.removeEventListener(AUTH_INVALIDATED_EVENT, handleInvalidation);
    };
  }, []);

  const setSession = (session: AuthSession) => {
    setToken(FRONTEND_SESSION_MARKER);
    setUser(session.user);
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
    try {
      await api.logout(token ?? FRONTEND_SESSION_MARKER);
    } catch {
      // Local state must still be cleared if the backend session already expired.
    }

    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!token) {
      return;
    }

    const profile = await api.fetchMe(token);

    setSession({
      user: profile.user,
    });
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
