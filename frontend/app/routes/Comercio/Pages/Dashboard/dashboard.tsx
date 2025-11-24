// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import "../geral.css"; // mantém regras globais
import { useParams } from "react-router";
import api from "src/api/axios";

/**
 * Serviço embutido: faz a chamada ao endpoint que implementamos no backend
 */
async function fetchDashboardCards(comercioId: number | string) {
  const res = await api.get(`/comercios/${comercioId}/dashboard/cards`);
  return res.data; // { zero_count, low_count, limite_global }
}

/**
 * Dashboard component (cards + estilo embutido)
 * - contém CSS inline (inserido via <style>) para manter tudo em um arquivo
 */
export default function Dashboard() {
  const { comercioId } = useParams() as { comercioId?: string };
  const [zeroCount, setZeroCount] = useState<number | null>(null);
  const [lowCount, setLowCount] = useState<number | null>(null);
  const [limiteGlobal, setLimiteGlobal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCards() {
    if (!comercioId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardCards(Number(comercioId));
      setZeroCount(Number(data.zero_count ?? 0));
      setLowCount(Number(data.low_count ?? 0));
      setLimiteGlobal(data.limite_global !== undefined ? (data.limite_global === null ? null : Number(data.limite_global)) : null);
    } catch (err: any) {
      console.error("Erro ao carregar cards:", err);
      setError(err?.response?.data?.error ?? err?.message ?? "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comercioId]);

  return (
    <div className="conteudo-item">
      {/* Estilos locais para os cards — você pode mover isso pro seu CSS depois */}
      <style>{`
        .dashboard-cards { display:flex; gap:16px; margin-top:18px; flex-wrap:wrap; }
        .card { flex: 1 1 260px; min-width:220px; border-radius:12px; padding:18px; color:#fff; box-shadow:0 4px 10px rgba(0,0,0,0.04); display:flex; flex-direction:column; justify-content:center; align-items:flex-start; }
        .card-title { font-size:14px; opacity:0.95; margin-bottom:6px; }
        .card-value { font-size:36px; font-weight:700; line-height:1; }
        .card-sub { font-size:12px; opacity:0.9; margin-top:6px; }
        .card-danger { background: linear-gradient(180deg, #ff6b6b 0%, #ff4b4b 100%); }
        .card-warning { background: linear-gradient(180deg, #ffb74d 0%, #ff9f24 100%); }
        @media (max-width:720px) {
          .dashboard-cards { flex-direction:column; }
          .card { width:100%; min-width:unset; }
        }
      `}</style>

      <h1>Dashboard</h1>

      <div className="dashboard-cards">
        <div className="card card-danger" aria-live="polite">
          <div className="card-title">Produtos com estoque zerado</div>
          <div className="card-value">{loading ? "..." : (zeroCount ?? 0)}</div>
        </div>

        <div className="card card-warning" aria-live="polite">
          <div className="card-title">Produtos com estoque baixo</div>
          <div className="card-value">{loading ? "..." : (lowCount ?? 0)}</div>
          <div className="card-sub">Limite global: {limiteGlobal ?? "—"}</div>
        </div>
      </div>

      {error && <div style={{ color: "crimson", marginTop: 12 }}>{error}</div>}
    </div>
  );
}
