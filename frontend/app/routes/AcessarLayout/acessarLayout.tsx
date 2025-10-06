// src/routes/Auth/AuthLayout.tsx
import { Link, Outlet, useLocation } from "react-router";
import PublicRoute from "src/api/auth/PublicRoute";
import "./acesso.css";

export default function AcessarLayout() {
  const location = useLocation();

  const isOnLogin = location.pathname.startsWith("/entrar");

  const toggleTarget = isOnLogin ? "/cadastrar" : "/entrar";
  const toggleText = isOnLogin
    ? "Não tem uma conta? Clique aqui para criar uma"
    : "Já tem uma conta? Clique aqui para entrar";

  return (
    <PublicRoute>
      <div className="page">
        <div className="leftContainer">
          <h1>Seja bem-vindo(a)!</h1>
          <Link to={toggleTarget} className="toggleButton">
            {toggleText}
          </Link>
        </div>

        <div className="rightContainer">
          <Outlet />
        </div>
      </div>
    </PublicRoute>
  );
}
