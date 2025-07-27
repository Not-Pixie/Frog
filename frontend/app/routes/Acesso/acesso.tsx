import { useState } from "react";
import "./acesso.css";

import { Link, Outlet } from "react-router";

function UserPage() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleLogin = () => {
    setIsLogin((prev) => (!prev));
  };

  return (
    <div className="page">
      <div className="leftContainer">
        <h1>Seja bem-vindo(a)!</h1>
        <Link onClick={toggleLogin} to={isLogin? "/acessar/cadastrar" : "/acessar"} className="toggleButton">
          {isLogin ? "Não tem uma conta? Clique aqui para criar uma" : "Já tem uma conta? Clique aqui para entrar"}
        </Link>
      </div>

      <div className="rightContainer">
        <Outlet/>
      </div>
    </div>
  );
}

export default UserPage;

