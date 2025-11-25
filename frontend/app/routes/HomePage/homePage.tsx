import { Link } from "react-router";
import type { Route } from '../../+types/root';
import PublicRoute from "src/api/auth/PublicRoute";
import "./homePage.css";
import { useState } from "react";

import sapinho from "src/imgs/sapinho.png"
import caixa from "src/imgs/caixa.png";

export default function HomePage() {
  const [texto, setTexto] = useState("");

  const textos = [
    "Frog é um sistema digital para auxiliar o controle de estoque, oferecendo praticidade, organização e uma visão clara de tudo o que acontece no negócio.",
    "Organize não só seus produtos com eficiência, mas também seus fornecedores, com o auxílio de um dashboard e com o monitoramento de entradas, saídas e histórico.",
    "Frog simplifica a gestão, aumenta sua produtividade e ajuda você a manter um controle preciso e eficiente do seu estoque."
  ];

  const handleClick = (index: any) => {
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
  <h1 className="TituloHome fadeInFull">Frog, inovação ao organizar</h1>
  {texto && <p key={texto} className="TextoHome fadeInFull">{texto}</p>}
</div>
      </div>

      <img src={sapinho} className="imgSapinho" />
      <img src={caixa} className="imgCaixa" />
    </PublicRoute>
  );
}
