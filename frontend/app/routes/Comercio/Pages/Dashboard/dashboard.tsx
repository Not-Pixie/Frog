// src/pages/Dashboard.tsx  (trecho completo com inclusion de DashboardCharts)
import React, { useEffect, useState } from "react";
import "../geral.css";
import "./dashboard.css";
import { useParams } from "react-router";
import api from "src/api/axios";
import DashboardCharts from "./dashboardcharts"; // ajuste o nome/case se necessário

async function fetchDashboardCards(comercioId: number | string) {
  const res = await api.get(`/api/comercios/${comercioId}/dashboard/cards`);
  return res.data;
}

function formatBRL(value: number | null | undefined) {
  try {
    const v = Number(value ?? 0);
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  } catch {
    return "R$ 0,00";
  }
}

export default function Dashboard() {
  const { comercioId } = useParams() as { comercioId?: string };
  const [zeroCount, setZeroCount] = useState<number | null>(null);
  const [lowCount, setLowCount] = useState<number | null>(null);
  const [limiteGlobal, setLimiteGlobal] = useState<number | null>(null);
  const [faturamentoTotal, setFaturamentoTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [year, setYear] = useState<number>(new Date().getFullYear());

  async function loadCards() {
    if (!comercioId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardCards(Number(comercioId));
      setZeroCount(Number(data.zero_count ?? 0));
      setLowCount(Number(data.low_count ?? 0));
      setLimiteGlobal(data.limite_global !== undefined ? (data.limite_global === null ? null : Number(data.limite_global)) : null);
      setFaturamentoTotal(data.faturamento_total !== undefined ? Number(data.faturamento_total) : null);
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
      <h1>Dashboard</h1>

      <div className="dashboard-cards" role="region" aria-label="Resumo do comércio">
        <div className="card card-danger" aria-live="polite">
          <div className="card-title">Produtos com estoque zerado</div>
          <div className="card-value">{loading ? "..." : (zeroCount ?? 0)}</div>
          <div className="card-sub">ㅤㅤ</div>
        </div>

        <div className="card card-warning" aria-live="polite">
          <div className="card-title">Produtos com estoque baixo</div>
          <div className="card-value">{loading ? "..." : (lowCount ?? 0)}</div>
          <div className="card-sub">Limite global: {limiteGlobal ?? "—"}</div>
        </div>

        <div className="card card-success" aria-live="polite">
          <div className="card-title">Faturamento</div>
          <div className="card-value">{loading ? "..." : formatBRL(faturamentoTotal ?? 0)}</div>
          <div className="card-sub">Total acumulado</div>
        </div>
      </div>

      {error && <div style={{ color: "crimson", marginTop: 12 }}>{error}</div>}


        {/* componente de gráficos - ele usa useParams pra pegar comercioId por si só,
            e aceita prop year (conforme seu DashboardCharts) */}
        <DashboardCharts year={year} />
      </div>
  );
}
