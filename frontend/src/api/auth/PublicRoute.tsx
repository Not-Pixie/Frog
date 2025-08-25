import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from './AuthProvider';

export default function PublicRoute({ children, redirectIfAuthenticated }:{ children: React.ReactNode, redirectIfAuthenticated?: boolean }) {
  if (!redirectIfAuthenticated) redirectIfAuthenticated = false;
  const { user, loading } = useAuth();
  if (loading) return <div>Carregando...</div>;
  if (user && redirectIfAuthenticated) return <Navigate to="/usuario" replace />;
  return children;
}