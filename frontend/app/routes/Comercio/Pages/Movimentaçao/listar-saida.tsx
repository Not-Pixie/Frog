// src/pages/listar-saidas.tsx
import "../geral.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import api from "src/api/axios";
import Button from "src/components/Button";
import Table from "src/components/Table";
import { formatCurrencyBRLRoundedDown, formatMovimentacaoDate } from "src/helpers";
import type { Movimentacoes } from "src/types/movimentacoes";
import { handleDelete } from "../../comercio.tsx";

interface APIResponse {
  movs: Movimentacoes[];
}

export default function ListarSaidas() {
  const { comercioId } = useParams();
  const [movimentacoes, setMovimentacoes] = useState<Movimentacoes[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);



  const fetchMovs = useCallback(async () => {
    if (!comercioId) return setMovimentacoes([]);
    setLoading(true);
    setError(null);
    try {
      // usa rota existente que retorna movimentações abertas
      const res = await api.get<APIResponse>(`/comercios/${comercioId}/movimentacoes/abertas`);
      if (!mountedRef.current) return;
      const all = res.data?.movs ?? [];

      // garante: mostra APENAS saídas
      const onlySaidas = Array.isArray(all) ? all.filter((m) => m.tipo === "saida") : [];
      setMovimentacoes(onlySaidas);
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Erro ao carregar movimentações"
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [comercioId]);

  const tableData = useMemo(() => {
    return movimentacoes
      .slice()
      .sort((a, b) => {
        const dateA = a.criado_em ? new Date(a.criado_em).getTime() : 0;
        const dateB = b.criado_em ? new Date(b.criado_em).getTime() : 0;
        return dateB - dateA;
      })
      .map((m) => ({
        ...m,
        criado_em: formatMovimentacaoDate(m.criado_em),
        valor_total: formatCurrencyBRLRoundedDown(m.valor_total),
      }));
  }, [movimentacoes]);

  useEffect(() => {
    mountedRef.current = true;
    fetchMovs();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchMovs]);

  const handleCreate = async () => {
    if (!comercioId) return;
    setCreating(true);
    setError(null);
    try {
      // usa a rota que você já tem para criar saída
      const res = await api.post<any>(`/comercios/${comercioId}/movimentacoes`, { tipo: "saida" });
      const newMov = res.data;
      const newLink = newMov?.link;
      if (!newLink)
        throw new Error("Resposta do servidor não retornou link da movimentação");

      // atualiza lista local opcionalmente
      setMovimentacoes((prev) => [newMov, ...prev]);

      // navega para a tela de edição/visualização da saída
      navigate(
        `/comercio/${comercioId}/saidas/${encodeURIComponent(String(newLink))}`
      );
    } catch (err: any) {
      const serverError =
        err?.response?.data?.error ??
        err?.response?.data?.msg ??
        err?.response?.data?.message;
      setError(
        serverError ?? err?.message ?? "Não foi possível criar movimentação"
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="conteudo-item page-header">
        <h1>Saídas</h1>
      </div>
      <div className="conteudo-item criar-mov">
        <Button theme="red" onClick={handleCreate} disabled={creating}>
          {creating ? "Criando..." : "Criar nova saída"}
        </Button>
        {error && <div className="error">{error}</div>}
      </div>
      <div className="conteudo-item">
        <Table
          data={tableData}
          columns={[
            { key: "codigo", label:"Código"},
            { key: "criado_em", label: "Data de Criação" },
            { key: "estado", label: "Status" },
            { key: "total_itens", label: "Total de Itens" },
            { key: "valor_total", label: "Valor Total (R$)" }
          ]}
          rowActions={(row: any) => (
            <div style={{ display: "flex", gap: 8 }}>
              {/* Link para a página da saída usando o link gerado */}
              <Link
                to={`/comercio/${comercioId}/saidas/${encodeURIComponent(String(row.link))}`}
                className="btn-edit"
                title="Abrir saída"
              >
                <i className="fi fi-rr-eye"></i>
              </Link>

              {/* Delete */}
              <button
                className="btn-delete"
                title="Excluir saída"
                onClick={async () => {
                  if (!comercioId) return;
                  try {
                    const res = await handleDelete("movimentacoes", row.mov_id, comercioId);
                    if (res.cancelled) return;
                    if (res.success) {
                      setMovimentacoes((prev) => prev.filter((m) => m.mov_id !== row.mov_id));
                    } else {
                      alert("Erro ao excluir: " + (res.error ?? "Resposta inesperada"));
                    }
                  } catch (e) {
                    console.error(e);
                    alert("Erro ao excluir movimentação. Veja console.");
                  }
                }}
              >
                <i className="fi fi-rr-trash-xmark"></i>
              </button>
            </div>
          )}
        />
      </div>{" "}
    </>
  );
}
