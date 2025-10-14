// produto.tsx
import "../geral.css";
import Button from "../../../../../src/components/Button/button.tsx";
import { useNavigate, useParams } from "react-router";

function Produto() {
  const navigate = useNavigate();
  const { comercioId } = useParams();

  function irParaCadastro() {
    // navegação ABSOLUTA dentro do comercio, para a rota irmã
    navigate(`/comercio/${comercioId}/produtos/novo-produto`);
  }

  return (
    <div className="conteudo-item produto-header">
      <h1>Produtos</h1>
      <Button theme="green" onClick={irParaCadastro} className="btn-cadastrar">
        Cadastrar produto
      </Button>
    </div>
  );
}

export default Produto;
