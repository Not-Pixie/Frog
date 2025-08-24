// src/api/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import api from '../axios';
import * as authServices from "./authServices"
import { LOGIN, LOGOUT } from '../enpoints';

type User = { id: number; email: string; name?: string } | null;

interface AuthContextType {
  user: User;
  loading: boolean;
  checkAuth: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  console.log('Teste useAuth:', ctx);
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  async function checkAuth(): Promise<boolean> {
    setLoading(true);
    try {
      const data = await authServices.fetchCurrentUser(); 
      if (!mountedRef) return false;
      const u = data?.user ?? null;
      setUser(u);
      return !!u;
    } catch (err) {
      if(mountedRef.current) setUser(null);
      return false;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const res = await api.post(LOGIN, { email, password });
      if (res.data?.acessToken) authServices.setAccessToken(res.data?.acessToken);
      await checkAuth();
      return true;
    } catch (err) {
      return false;
    }
  }

  async function logout() {
    try {
      await authServices.logoutServer();
    } finally {
      setUser(null);
      authServices.setAccessToken(null)
    }
  }

    useEffect(() => {
      mountedRef.current = true;
      (async () => {
        await checkAuth();
      })();
      return () => { mountedRef.current = false; };
  }, []);


  return (
    <AuthContext.Provider value={{ user, setUser, loading, checkAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
