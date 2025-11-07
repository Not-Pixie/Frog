import "../geral.css";
import Button from "../../../../../src/components/Button/button.tsx";
import { Link, useParams } from "react-router";
import Table from "src/components/Table/Table.tsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { COMERCIOS } from "src/api/enpoints.ts";
import api from "src/api/axios.ts";
import axios from "axios";
import type { Fornecedor } from "src/types/fornecedor.ts"

function Fornecedores() {
  const { comercioId } = useParams();
  const [isLoad, setLoading] = useState<boolean>(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <>
      <div className="conteudo-item produto-header">
        <h1>Fornecedores</h1>
      </div>

      <div className="conteudo-item">
        <Table
          data={fornecedores}
          keyField="fornecedor_id"
          columns={[
            { key: "fornecedor_id", label: "Código" },
            { key: "nome", label: "Nome" },
            { key: "cnpj", label: "CNPJ" },
            { key: "endereco.cep", label: "CEP" },
            { key: "endereco.numero", label: "Número" },
            { key: "telefone", label: "Telefone" },
          ]}
          rowActions={(row: any) => (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => {/* navegar para editar no futuro */}}>Editar</button>
              <button onClick={() => {/* implementar exclusão se quiser */}}>Excluir</button>
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
