import { Link } from "react-router";
import type { Route } from '../../+types/root';
import PublicRoute from "src/api/auth/PublicRoute";
import "./homePage.css";
import { useState } from "react";

export default function HomePage() {
  const [texto, setTexto] = useState(""); // começa vazio

  const textos = [
    "Frog é uma plataforma inovadora para controle de estoque.",
    "Organize seus produtos com eficiência usando Frog.",
    "Frog simplifica a gestão e aumenta sua produtividade."
  ];

  const handleClick = (index) => {
    setTexto(textos[index]);
  };

  return (
    <PublicRoute>
      <div className="central">
        <div className="Acima">
          <div className="ListaHome">
            <ul>
              <li onClick={() => handleClick(0)}>Sobre</li>
              <li onClick={() => handleClick(1)}>Funcionalidades</li>
              <li onClick={() => handleClick(2)}>Benefícios</li>
            </ul>
          </div>

          <div className="AcessarFrog">
            <Link to="/entrar" className="btnEntrarHome">Entrar</Link>
            <Link to="/cadastrar" className="btnCadastrarHome">Cadastre-se</Link>
          </div>
        </div>

        <div className="CorpoHome">
          <h1 className="TituloHome">Frog, uma nova forma de organizar</h1>
          {texto && <p className="TextoHome">{texto}</p>}
        </div>
      </div>
    </PublicRoute>
  );
}
