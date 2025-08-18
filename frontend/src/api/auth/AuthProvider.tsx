// src/api/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import api from '../axios';

type User = { id: number; email: string; name?: string } | null;

interface AuthContextType {
  user: User;
  loading: boolean;
  checkAuth: () => void;
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

  async function checkAuth() {
    setLoading(true);
    try {
      const res = await api.get('/api/me'); 
      const u = res.data?.user ?? null;
      setUser(u);
    } catch (err) {
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const res = await api.post('/api/login', { email, password });
      await checkAuth();
      return true;
    } catch (err) {
      return false;
    }
  }

  async function logout() {
    try {
      await api.post('/api/logout');
    } finally {
      setUser(null);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await checkAuth();
      if (!mounted) return;
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, checkAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
