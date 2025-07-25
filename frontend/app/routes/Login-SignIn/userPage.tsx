import { useState } from "react";
import "./userPage.css";

import FormLogin from "./components/Login/formLogin";
import FormSignIn from "./components/SignIn/formSignIn";

function UserPage() {
  const [modo, setModo] = useState<"login" | "signIn">("login");

  const toggleModo = () => {
    setModo((prev) => (prev === "login" ? "signIn" : "login"));
  };

  return (
    <div className="page">
      <div className="leftContainer">
        <h1>Seja bem-vindo(a)!</h1>
        <button onClick={toggleModo} className="toggleButton">
          {modo === "login" ? "Não tem uma conta? Clique aqui para criar uma" : "Já tem uma conta? Clique aqui para entrar"}
        </button>
      </div>

      <div className="rightContainer">
        {modo === "login" ? <FormLogin /> : <FormSignIn />}
      </div>
    </div>
  );
}

export default UserPage;

