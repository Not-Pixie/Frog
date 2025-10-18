// produto.tsx
import "../geral.css";
import Button from "../../../../../src/components/Button/button.tsx";
import { Link, useNavigate, useParams } from "react-router";
import Table from "src/components/Table/Table.tsx";
import { useCallback, useEffect, useRef, useState } from "react";
import CategoriaPopUp from "./CategoriaPopUp.tsx";
import { COMERCIOS } from "src/api/enpoints.ts";
import api from "src/api/axios.ts";
import axios from "axios";

type Produto = {
  produto_id: number;           // INT no DB
  codigo: string;               // String(50) no DB (único, not null)
  nome: string;                 // String no DB
  preco: number;                // Numeric -> enviado como number
  quantidade_estoque: number;   // INT no DB
  tags?: string | null;         // String nullable
  unimed_id: number;
  categoria_id: number;
  fornecedor_id: number;
  comercio_id: number;

  criado_em: string;            // ISO datetime string (server_default func.now() -> isoformat)
  atualizado_em: string;        // ISO datetime string

  // Campos derivados adicionados pela lógica do endpoint (podem não existir em todos os responses)
  categoriaNome?: string | null;
  fornecedorNome?: string | null;
  unidadeMedidaNome?: string | null;

};

type APIResponse = {
  items: Produto[];
  total: number;
};

function Produto() {
  const { comercioId } = useParams();
  const [isModal, setModal] = useState<boolean>(false);
  const [isLoad, setLoading] = useState<boolean>(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);

  const fetchProdutos = useCallback(async () => {
    const url = `${COMERCIOS}/${comercioId}/produtos`;
    setLoading(true);
    try {
      const res = await api.get<APIResponse>(url);
      setProdutos(res.data.items);
    }
    catch (error: unknown) 
    {
      console.error("Erro ao buscar produtos:", error);

    // Caso AxiosError (erros HTTP, network, timeout, etc)
    if (axios.isAxiosError(error)) {
      const axiosError = error;
      const status = axiosError.response?.status;
      const body = axiosError.response?.data;

      // Mensagem preferencial: payload do servidor (se existir)
      const serverMsg = body?.msg ?? body?.message ?? body?.error ?? null;

      // Diferenciar causas comuns
      if (status === 401) {
        setError("Não autorizado. Faça login novamente.");
      } else if (status === 404) {
        setError("Recursos não encontrados.");
      } else if (status && status >= 500) {
        setError("Erro no servidor. Tente novamente mais tarde.");
      } else if (serverMsg) {
        setError(String(serverMsg));
      } else if (axiosError.code === "ECONNABORTED") {
        setError("Tempo de conexão esgotado. Tente novamente.");
      } else if (!axiosError.response) {
        setError("Falha de rede. Verifique sua conexão e tente novamente.");
      } else {
        setError(`Erro na requisição. (${status ?? "desconhecido"})`);
      }
    } else {
      const maybeError = error as Error | undefined;
      setError(maybeError?.message ?? "Erro desconhecido ao buscar produtos.");
    }
    }
    finally{
      setLoading(true);
    }
  }, [])

  const handleDelete = (id: number) => {
  };

  useEffect(() => {
    if(!mountedRef.current)
      mountedRef.current = true;
   
    fetchProdutos();

    return () => {mountedRef.current = false};
  }, [])

  return (
    <>
      <div className="conteudo-item produto-header">
        <h1>Produtos</h1>
      </div>

      <div className="conteudo-item">
        <Table
          data={produtos}
          keyField="produto_id"
          columns={[
        { key: "codigo", label: "Código" },
        { key: "nome", label: "Produto" },
        { key: "preco", label: "Preço (R$)" },
        { key: "quantidade_estoque", label: "Qtd" },
          ]}
          rowActions={(row: any) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            aria-label={`Editar ${row.produto_id}`}
            onClick={() => /* navegar/editar */ null}
          >
            Editar
          </button>
          <button
            aria-label={`Excluir ${row.produto_id}`}
            onClick={() => handleDelete(row.produto_id)}
          >
            Excluir
          </button>
        </div>
          )}
          actionHeader="Opções"
        />
      </div>

      <div className="conteudo-item botoes">
        <Link to={`/comercio/${comercioId}/produtos/novo-produto`}>
          <Button theme="green" className="btn-cadastrar">
            Cadastrar produto
          </Button>
        </Link>
        <Button theme="green" onClick={() => setModal(true)}>
          Gerenciar categorias
        </Button>
      </div>

      <CategoriaPopUp
        isOpen={isModal}
        onClose={() => setModal(false)}
        onCreated={() => setModal(false)}
      />
    </>
  );
}

export default Produto;
