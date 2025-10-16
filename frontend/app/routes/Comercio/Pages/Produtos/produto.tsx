// produto.tsx
import "../geral.css";
import Button from "../../../../../src/components/Button/button.tsx";
import { useNavigate, useParams } from "react-router";
import Table from "src/components/Table/Table.tsx";
import { useState } from "react";
import CategoriaPopUp from "./CategoriaPopUp";

type Produto = {
  id: string;
  nome: string;
  preco: number;
  sku: string;
  quantidade: number;
};

function Produto() {
  const navigate = useNavigate();
  const { comercioId } = useParams();

  const [isCategoriaOpen, setCategoriaOpen] = useState<boolean>(false);
  const [produtosMock, setProdutosMock] = useState<Produto[]>([
    {
      id: "1",
      nome: "Arroz Integral",
      preco: 18.9,
      sku: "ARZ-001",
      quantidade: 50,
    },
    {
      id: "2",
      nome: "Feijão Preto",
      preco: 9.5,
      sku: "FJN-002",
      quantidade: 120,
    },
    {
      id: "3",
      nome: "Açúcar Mascavo",
      preco: 6.75,
      sku: "ACR-003",
      quantidade: 80,
    },
    {
      id: "4",
      nome: "Óleo de Soja",
      preco: 7.99,
      sku: "OLE-004",
      quantidade: 30,
    },
    {
      id: "5",
      nome: "Farinha de Trigo",
      preco: 4.5,
      sku: "FAR-005",
      quantidade: 200,
    },
    {
      id: "10",
      nome: "Arroz Integral",
      preco: 18.9,
      sku: "ARZ-001",
      quantidade: 50,
    },
    {
      id: "20",
      nome: "Feijão Preto",
      preco: 9.5,
      sku: "FJN-002",
      quantidade: 120,
    },
    {
      id: "30",
      nome: "Açúcar Mascavo",
      preco: 6.75,
      sku: "ACR-003",
      quantidade: 80,
    },
    {
      id: "40",
      nome: "Óleo de Soja",
      preco: 7.99,
      sku: "OLE-004",
      quantidade: 30,
    },
    {
      id: "56",
      nome: "Farinha de Trigo",
      preco: 4.5,
      sku: "FAR-005",
      quantidade: 200,
    },
    {
      id: "15",
      nome: "Arroz Integral",
      preco: 18.9,
      sku: "ARZ-001",
      quantidade: 50,
    },
    {
      id: "24",
      nome: "Feijão Preto",
      preco: 9.5,
      sku: "FJN-002",
      quantidade: 120,
    },
    {
      id: "33",
      nome: "Açúcar Mascavo",
      preco: 6.75,
      sku: "ACR-003",
      quantidade: 80,
    },
    {
      id: "42",
      nome: "Óleo de Soja",
      preco: 7.99,
      sku: "OLE-004",
      quantidade: 30,
    },
    {
      id: "51",
      nome: "Farinha de Trigo",
      preco: 4.5,
      sku: "FAR-005",
      quantidade: 200,
    },
  ]);

  function irParaCadastro() {
    // navegação ABSOLUTA dentro do comercio, para a rota irmã
    navigate(`/comercio/${comercioId}/produtos/novo-produto`);
  }

  function handleDelete(id: string) {
    setProdutosMock((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <>
      <div className="conteudo-item produto-header">
        <h1>Produtos</h1>
      </div>

      <div className="conteudo-item">
        <Table
          data={produtosMock}
          keyField="id"
          columns={[
            { key: "nome", label: "Produto" },
            { key: "preco", label: "Preço (R$)" },
            { key: "sku", label: "SKU" },
            { key: "quantidade", label: "Qtd" },
          ]}
          rowActions={(row) => (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                aria-label={`Editar ${row.id}`}
                onClick={() => /* navegar/editar */ null}
              >
                Editar
              </button>
              <button
                aria-label={`Excluir ${row.id}`}
                onClick={() => handleDelete(row.id)}
              >
                Excluir
              </button>
            </div>
          )}
          actionHeader="Opções"
        />
      </div>

      <div className="conteudo-item">
        <Button
          theme="green"
          onClick={irParaCadastro}
          className="btn-cadastrar"
        >
          Cadastrar produto
        </Button>

        <Button
          theme="green"
          onClick={() => setCategoriaOpen(true)}
          className="btn-cadastrar"
          style={{ marginLeft: 8 }}
        >
          Criar categoria
        </Button>
      </div>

      <CategoriaPopUp
        isOpen={isCategoriaOpen}
        onClose={() => setCategoriaOpen(false)}
        onCreated={() => {
          setCategoriaOpen(false);
        }}
      />
    </>
  );
}

export default Produto;
