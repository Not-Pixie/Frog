// src/pages/.../Fornecedores.tsx  (ajuste o caminho conforme seu projeto)
import "../geral.css";
import Button from "../../../../../src/components/Button/button.tsx";
import { Link, useParams } from "react-router";
import Table from "src/components/Table/Table.tsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { COMERCIOS } from "src/api/enpoints.ts";
import api from "src/api/axios.ts";
import axios from "axios";
import type { Fornecedor } from "src/types/fornecedor.ts"
import { handleDelete } from "../../comercio";

function Fornecedores() {
  const { comercioId } = useParams();
  const [isLoad, setLoading] = useState<boolean>(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const mountedRef = useRef(false);

  const fetchFornecedores = useCallback(async () => {
    if (!comercioId) return;
    const url = `${COMERCIOS}/${comercioId}/fornecedores`;
    setLoading(true);
    try {
      const res = await api.get(url);
      setFornecedores(res.data.items ?? []);
      setError(null);
    } catch (error: unknown) {
      console.error("Erro ao buscar fornecedores:", error);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401) setError("Não autorizado. Faça login novamente.");
        else if (status && status >= 500) setError("Erro no servidor. Tente novamente mais tarde.");
        else setError("Erro ao buscar fornecedores.");
      } else {
        setError("Erro desconhecido ao buscar fornecedores.");
      }
    } finally {
      setLoading(false);
    }
  }, [comercioId]);

  useEffect(() => {
    if (!mountedRef.current) mountedRef.current = true;
    fetchFornecedores();
    return () => { mountedRef.current = false; };
  }, [fetchFornecedores]);

  const onDelete = async (id: number) => {
    if (!comercioId) {
      alert("ID do comércio não encontrado.");
      return;
    }
    setDeletingId(id);
    try {
      const result = await handleDelete("fornecedores", id, Number(comercioId));
      if (result.success) {
        setFornecedores((prev) => prev.filter((f) => f.fornecedor_id !== id));
        console.log("Fornecedor excluído");
      } else if (!result.cancelled) {
        alert(result.error ?? "Erro ao excluir fornecedor.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="conteudo-item produto-header">
        <h1>Fornecedores</h1>
      </div>

      <div className="conteudo-item">
        {error && <div className="text-red-600">{error}</div>}
        <Table
          data={fornecedores}
          keyField="fornecedor_id"
          columns={[
            { key: "codigo", label: "Código" },
            { key: "nome", label: "Nome" },
            { key: "cnpj", label: "CNPJ" },
            { key: "endereco.cep", label: "CEP" },
            { key: "endereco.numero", label: "Número" },
            { key: "telefone", label: "Telefone" },
          ]}
          rowActions={(row: any) => (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => {/* navegar para editar no futuro */}}>
                <i className="fi fi-rr-pencil" style={{ fontSize: 20, color: "#35AC97" }}></i>
                </button>
              <button
                onClick={() => onDelete(Number(row.fornecedor_id ?? row.id))}
                disabled={deletingId !== null && deletingId === Number(row.fornecedor_id ?? row.id)}
              >
                 <i className="fi fi-rr-trash-xmark" style={{ fontSize: 20, color: "#F45959" }}></i>
                {deletingId !== null && deletingId === Number(row.fornecedor_id ?? row.id) ? "Excluindo..." : ""}
              </button>
            </div>
          )}
          actionHeader="Opções"
        />
      </div>

      <div className="conteudo-item botoes">
        <Link to={`/comercio/${comercioId}/fornecedores/novo-fornecedor`}>
          <Button theme="green" className="btn-cadastrar">
            Cadastrar fornecedor
          </Button>
        </Link>
      </div>
    </>
  );
}

export default Fornecedores;
