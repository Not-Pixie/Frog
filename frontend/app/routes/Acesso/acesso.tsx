import { useState } from "react";
import "./acesso.css";

import { Link, Outlet } from "react-router";
import PublicRoute from "src/api/auth/PublicRoute";

function UserPage() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleLogin = () => {
    setIsLogin((prev) => (!prev));
  };

  return (
    <PublicRoute>
      <div className="page">
        <div className="leftContainer">
          <h1>Seja bem-vindo(a)!</h1>
          <Link onClick={toggleLogin} to={isLogin? "/acessar/cadastrar" : "/acessar"} className="toggleButton">
            {isLogin ? "Não tem uma conta? Clique aqui para criar uma" : "Já tem uma conta? Clique aqui para entrar"}
          </Link>
          <Link to="/usuario" className="text-blue-500 hover:underline">
          Ir para a página de usuario
        </Link>
        </div>
        <div className="rightContainer">
          <Outlet/>
        </div>
      </div>
    </PublicRoute>
  );
}

export default UserPage;

