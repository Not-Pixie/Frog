// src/api/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import api from '../axios';
import * as authServices from "./authServices"
import { LOGIN } from '../enpoints';

type User = { usuario_id: number; email: string; nome?: string } | null;

interface AuthContextType {
  user: User;
  token?: string | null;
  loading: boolean;
  checkAuth: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
  setToken?: (t: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  async function checkAuth(): Promise<boolean> {
    if (!mountedRef.current) return false;
    if (mountedRef.current) setLoading(true);
    try {
      const data = await authServices.fetchCurrentUser();
      if (!mountedRef.current) return false;
      const u = data?.usuario ?? null;
      setUser(u);
      return !!u;
    } catch (err) {
      if (mountedRef.current) setUser(null);
      return false;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const res = await api.post(LOGIN, { email, senha: password });
      if (res.data?.access_token) {
        const newToken = res.data.access_token as string;
        authServices.setAccessToken(newToken);
        setToken(newToken);
        await checkAuth();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  async function logout() {
    try {
      await authServices.logoutServer();
    } finally {
      setUser(null);
      authServices.setAccessToken(null);
      setToken(null);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      // tenta obter token do authServices (se existir) ou do localStorage como fallback
      const existingToken = (authServices as any).getAccessToken?.() ?? localStorage.getItem("access_token");
      if (existingToken) setToken(existingToken as string);
      if (user) await (authServices as any).refresh?.();
      await checkAuth();
    })();
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, setUser, loading, checkAuth, login, logout, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}
