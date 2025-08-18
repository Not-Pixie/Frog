import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from './AuthProvider';

export default function PublicRoute({ children }:{ children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Carregando...</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}