// src/pages/historico.tsx
import "../geral.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router";
import api from "src/api/axios";
import Button from "src/components/Button";
import Table from "src/components/Table";
import { formatMovimentacaoDate } from "src/helpers";
import type { Movimentacoes } from "src/types/movimentacoes";
import { handleDelete } from "../../comercio";

interface APIResponse {
  movs: Movimentacoes[];
}

export default function Historico() {
  const { comercioId } = useParams() as { comercioId?: string };
  const [movimentacoes, setMovimentacoes] = useState<Movimentacoes[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchMovs = useCallback(async () => {
    if (!comercioId) return setMovimentacoes([]);
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<APIResponse>(`/comercios/${comercioId}/movimentacoes`);
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
    return () => { mountedRef.current = false; };
  }, [fetchMovs]);

  const tableData = useMemo(() => {
    return movimentacoes.slice().sort((a, b) => {
      const dateA = a.criado_em ? new Date(a.criado_em).getTime() : 0;
      const dateB = b.criado_em ? new Date(b.criado_em).getTime() : 0;
      return dateB - dateA;
    }).map(m => ({
      ...m,
      criado_em: formatMovimentacaoDate(m.criado_em)
    }));
  }, [movimentacoes]);

  return (
    <>
      <div className="conteudo-item page-header">
        <h1>Histórico de Movimentações</h1>
      </div>

      <div className="conteudo-item">
        <Table
          data={tableData}
          columns={[
            { key: "criado_em", label: "Data de Criação" },
            { key: "tipo", label: "Tipo" },
            { key: "estado", label: "Status" },
            { key: "total_itens", label: "Total de Itens" },
            { key: "valor_total", label: "Valor Total (R$)" }
          ]}
          rowActions={(row: any) => {
            const tipo = String((row.tipo ?? "")).toLowerCase();
            const routeForType = tipo === "entrada" ? "entradas" : tipo === "saida" ? "saidas" : null;
            const linkValue = encodeURIComponent(String(row.link ?? row.mov_id ?? ""));
            return (
              <div style={{ display: "flex", gap: 8 }}>
                {routeForType ? (
                  <Link
                    to={`/comercio/${comercioId}/${routeForType}/${linkValue}`}
                    className="btn-edit"
                    title={`Abrir ${tipo}`}
                  >
                    <i className="fi fi-rr-eye"></i>
                  </Link>
                ) : (
                  <button
                    className="btn-edit"
                    title="Tipo desconhecido"
                    onClick={() => alert("Tipo da movimentação desconhecido. Não é possível abrir automaticamente.")}
                  >
                    <i className="fi fi-rr-eye"></i>
                  </button>
                )}

                <button
                  className="btn-delete"
                  title="Excluir movimentação"
                  disabled={deletingId !== null && deletingId === Number(row.mov_id)}
                  onClick={async () => {
                  if (!comercioId) return;

                  try {
                    setDeletingId(Number(row.mov_id));
                    const res = await handleDelete("movimentacoes", Number(row.mov_id), Number(comercioId));
                    if (res.cancelled) return;
                    if (res.success) {
                    setMovimentacoes((prev) => prev.filter((m) => m.mov_id !== row.mov_id));
                    } else {
                    alert("Erro ao excluir: " + (res.error ?? "Resposta inesperada"));
                    }
                  } catch (e) {
                    console.error(e);
                    alert("Erro ao excluir movimentação. Veja o console.");
                  } finally {
                    setDeletingId(null);
                  }
                  }}
                >
                  <i className="fi fi-rr-trash-xmark"></i>
                </button>
              </div>
            );
          }}
          actionHeader="Opções"
          emptyMessage={loading ? "Carregando movimentações..." : "Nenhuma movimentação encontrada"}
        />
      </div>
    </>
  );
}
