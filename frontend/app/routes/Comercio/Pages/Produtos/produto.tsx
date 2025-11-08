// produto.tsx
import "../geral.css";
import Button from "../../../../../src/components/Button/button.tsx";
import { Link, useNavigate, useParams } from "react-router";
import Table from "src/components/Table/Table.tsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { COMERCIOS } from "src/api/enpoints.ts";
import api from "src/api/axios.ts";
import axios from "axios";

import type { Produto } from "src/types/produto.ts";

type APIResponse = {
  items: Produto[];
  total: number;
};

function Produto() {
  const { comercioId } = useParams();
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
      setError(null);
    } catch (error: unknown) {
      console.error("Erro ao buscar produtos:", error);

      if (axios.isAxiosError(error)) {
        const axiosError = error;
        const status = axiosError.response?.status;
        const body = axiosError.response?.data;
        const serverMsg = body?.msg ?? body?.message ?? body?.error ?? null;

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
    } finally {
      setLoading(false); // CORREÇÃO: antes estava true
    }
  }, [comercioId]);

  const handleDelete = (id: number) => {
    // implementar se quiser excluir produto daqui
  };

  useEffect(() => {
    if (!mountedRef.current) mountedRef.current = true;
    fetchProdutos();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchProdutos]);

  return (
    <>
      <div className="conteudo-item produto-header">
        <h1>Produtos</h1>
      </div>

      <div className="conteudo-item">
        <Table
          data={produtos}
          keyField="codigo"
          columns={[
            { key: "codigo", label: "Código" },
            { key: "nome", label: "Produto" },
            { key: "preco", label: "Preço (R$)" },
            { key: "quantidade_estoque", label: "Qtd" },
          ]}
          rowActions={(row: any) => (
            <div style={{ display: "flex", gap: 8 }}>
              <button aria-label={`Editar ${row.produto_id}`} onClick={() => /* navegar/editar */ null}>
                Editar
              </button>
              <button aria-label={`Excluir ${row.produto_id}`} onClick={() => handleDelete(row.produto_id)}>
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

        {/* NAVEGAÇÃO para nova página de categorias (substitui modal) */}
        <Link to={`/comercio/${comercioId}/produtos/categorias`}>
          <Button theme="green">Gerenciar categorias</Button>
        </Link>
      </div>
    </>
  );
}

export default Produto;
