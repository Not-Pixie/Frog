import "../geral.css"

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import api from "src/api/axios";
import Button from "src/components/Button";
import Table from "src/components/Table";
import type { Movimentacoes } from "src/types/movimentacoes";

interface APIResponse {
  movs: Movimentacoes[];
}

export default function ListarEntradas() {
  const { comercioId } = useParams();
  const navigate = useNavigate();

  const [movimentacoes, setMovimentacoes] = useState<Movimentacoes[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);

  const fetchMovs = useCallback(async () => {
    if (!comercioId) return setMovimentacoes([]);
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<APIResponse>(`/comercios/${comercioId}/movimentacoes/abertas`);
      if (!mountedRef.current) return;
      setMovimentacoes(res.data?.movs ?? []);
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err?.response?.data?.message ?? err?.message ?? "Erro ao carregar movimentações");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [comercioId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchMovs();
    return () => { mountedRef.current = false; }
  }, [fetchMovs]);

  const handleCreate = async () => {
    if (!comercioId) return;
    setCreating(true);
    setError(null);
    try {
      const res = await api.post<{ link: number }>(`/comercios/${comercioId}/movimentacoes/entrada`);
      const newId = res.data?.link;
      if (!newId) throw new Error("Resposta do servidor não retornou id");
      navigate(`${newId}`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Não foi possível criar movimentação");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="conteudo-item page-header">
        <h1>Entradas</h1>
      </div>

      <div className="conteudo-item criar-mov">
        <Button theme="green" onClick={handleCreate} disabled={creating}>
          {creating ? "Criando..." : "Criar nova entrada"}
        </Button>
        {error && <div className="error">{error}</div>}
      </div>

      <div className="conteudo-item">
        <Table data={movimentacoes} />
      </div>
    </>
  );
}
