import { Outlet, NavLink, useParams, useNavigate } from "react-router";
import { useCallback, useEffect, useState } from "react";
import "./comercioLayout.css";
import ProtectedRoute from "src/api/auth/ProtectedRoute";
import { Sidebar } from "./customComponents/SideBar";
import { useAuth } from "src/api/auth/AuthProvider";

import type { AuthContextType, User } from "src/types/auth.types"
import LoadingPage from "src/pages/LoadingPages";

export default function ComercioLayout() {
  const {comercioId} = useParams();
  const {user, loading} = useAuth();
  const navigate = useNavigate();

  const baseUrl = `/comercio/${comercioId}`;
  const id = comercioId ? Number(comercioId) : NaN;
  const validId = !isNaN(id);

  const validUser = !loading && Boolean(user) && validId && Array.isArray(user?.comercios) && user.comercios!.includes(id);

  useEffect(() => {
    if(loading) return;
    
    if(!validUser && user)
      navigate('/meus-comercios', {replace: true})
  }, [loading, validUser, user, navigate]);

  if (loading)
    return <LoadingPage/>;

  if (!validUser)
    return (
      <ProtectedRoute>
        <div>
          Acesso Negado
        </div>
      </ProtectedRoute>
  )

  return (
    <ProtectedRoute>
      <div className="layout">
        <Sidebar baseUrl={baseUrl}/>
        {/* Onde as páginas vão renderizar */}
        <div className="conteudo">
          <Outlet />
        </div>
      </div>
    </ProtectedRoute>
  );
}
