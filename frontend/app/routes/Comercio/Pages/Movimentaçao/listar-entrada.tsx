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
    const { link, comercioId } = useParams();
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
        const res = await api.post<any>(`/comercios/${comercioId}/movimentacoes/entrada`);
        const newMov = res.data;
        const newLink = newMov?.link;
        if (!newLink) throw new Error("Resposta do servidor não retornou link da movimentação");

        // atualizar lista local (opcional)
        setMovimentacoes(prev => [newMov, ...prev]);

        // navegar para a rota baseada em link (encode para segurança)
        navigate(`/comercio/${comercioId}/entradas/${encodeURIComponent(String(newLink))}`);  } catch (err: any) {
        const serverError = err?.response?.data?.error ?? err?.response?.data?.msg ?? err?.response?.data?.message;
        setError(serverError ?? err?.message ?? "Não foi possível criar movimentação");
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
              <Table
              data={movimentacoes
                .sort((a, b) => {
                const dateA = a.criado_em ? new Date(a.criado_em).getTime() : 0;
                const dateB = b.criado_em ? new Date(b.criado_em).getTime() : 0;
                return dateB - dateA;
                })
                .map(m => {
                const d = m.criado_em ? new Date(m.criado_em) : null;
                let criado_em_formatted = "";
                if (d && !isNaN(d.getTime())) {
                const dd = String(d.getDate()).padStart(2, "0");
                const mm = String(d.getMonth() + 1).padStart(2, "0");
                const yy = String(d.getFullYear()).slice(-2);
                const hh = String(d.getHours()).padStart(2, "0");
                const min = String(d.getMinutes()).padStart(2, "0");
                const ss = String(d.getSeconds()).padStart(2, "0");
                criado_em_formatted = `${dd}/${mm}/${yy} em ${hh}:${min}:${ss}`;
                } else {
                criado_em_formatted = String(m.criado_em ?? "");
                }
                return { ...m, criado_em: criado_em_formatted };
              })}
              columns={[
                { key: "criado_em", label: "Data de Criação" },
                { key: "estado", label: "Status" },
                { key: "total_itens", label: "Total de Itens" },
                { key: "valor_total", label: "Valor Total (R$)" },
                { key: "", label: "Opções" }
              ]}
              />
            </div>  </>
    );
  }
