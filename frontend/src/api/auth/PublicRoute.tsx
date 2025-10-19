import React from 'react';
import { useAuth } from './AuthProvider';
import LoadingPage from 'src/pages/LoadingPages';

export default function PublicRoute({ children, redirectIfAuthenticated }:{ children: React.ReactNode, redirectIfAuthenticated?: boolean }) {
  if (!redirectIfAuthenticated) redirectIfAuthenticated = false;
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage/>;
  if (user && redirectIfAuthenticated) return children;
  return children;
}