import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from './AuthProvider';
import LoadingPage from 'src/pages/LoadingPages';

export default function ProtectedRoute({ children }:{ children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage/>;
  if (!user) return <Navigate to="/entrar" replace />;
  return children;
}