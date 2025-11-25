// src/pages/DashboardCharts.tsx
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useParams } from "react-router";
import { fetchMovimentacoesMensais } from "src/helpers";

/* paleta fria (azuis / verdes) — fácil de distinguir */
const COOL_COLORS = [
  "#2b9bd6", "#35ac97", "#3aa6c9", "#5fb7a1",
  "#47a1d9", "#6fb3e6", "#90d1c0", "#4aa6a3",
  "#2f8fbd", "#68c0d8", "#1f77b4", "#4ecdc4",
];

/**
 * Tooltip robusto: tenta extrair label/nome do payload em diversas formas.
 * Mostra itens e faturamento quando disponíveis.
 */
function ValueTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  // payload[0] pode ter shape diferente dependendo do chart
  const first = payload[0] || {};
  const payloadItem = first.payload ?? first; // fallback se first já tem os campos
  // label param pode ser undefined (especialmente no Pie). Fazemos fallbacks:
  const labelFallback =
    (label !== undefined && label !== null && String(label).trim() !== "" && String(label)) ||
    payloadItem?.name ||
    payloadItem?.label ||
    payloadItem?.month ||
    payloadItem?.monthLabel ||
    "";

  // extrações seguras de métricas
  const itens = payloadItem?.total_itens ?? payloadItem?.value ?? payloadItem?.itens ?? null;
  const faturamento = payloadItem?.faturamento ?? payloadItem?.valor_total ?? null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.98)",
      padding: 10,
      borderRadius: 8,
      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
      fontSize: 13,
      color: "#222",
      minWidth: 140
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{String(labelFallback)}</div>
      {itens !== null && <div>Itens: <strong>{String(itens)}</strong></div>}
      {faturamento !== null && (
        <div>Faturamento: <strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(faturamento))}</strong></div>
      )}
    </div>
  );
}

export default function DashboardCharts({ year }: { year?: number }) {
  const { comercioId } = useParams() as { comercioId?: string };
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!comercioId) return;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const resAll = await fetchMovimentacoesMensais(Number(comercioId), year, "all");
        const resSaidas = await fetchMovimentacoesMensais(Number(comercioId), year, "saida");
        const arrAll = Array.isArray(resAll?.data) ? resAll.data : (resAll?.data ?? []);
        const arrSaidas = Array.isArray(resSaidas?.data) ? resSaidas.data : (resSaidas?.data ?? []);

        const mapAll: Record<number, any> = {};
        arrAll.forEach((r: any) => {
          const m = Number(r.month);
          if (!Number.isNaN(m) && m >= 1 && m <= 12) mapAll[m] = r;
        });
        const mapSaidas: Record<number, any> = {};
        arrSaidas.forEach((r: any) => {
          const m = Number(r.month);
          if (!Number.isNaN(m) && m >= 1 && m <= 12) mapSaidas[m] = r;
        });

        const labels = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
        const merged: any[] = [];
        for (let m = 1; m <= 12; m++) {
          const a = mapAll[m] || {};
          const s = mapSaidas[m] || {};
          merged.push({
            month: m,
            name: labels[m-1] || String(m),
            total_itens: Number(a.total_itens ?? 0),
            valor_total_all: Number(a.valor_total ?? 0),
            mov_count_all: Number(a.mov_count ?? 0),
            faturamento: Number(s.valor_total ?? 0),
            mov_count_saidas: Number(s.mov_count ?? 0),
          });
        }

        setData(merged);
      } catch (err: any) {
        console.error("Erro ao carregar dados do dashboard (charts):", err);
        setError(err?.message ?? "Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    })();
  }, [comercioId, year]);

  // datasets ordenados Jan..Dec (data já montada nessa ordem)
  const barData = data.map(d => ({ name: d.name, total_itens: d.total_itens }));
  const lineData = data.map(d => ({ name: d.name, faturamento: Number(d.faturamento ?? 0) }));
  const pieData = data.map(d => ({ name: d.name, value: Number(d.total_itens ?? 0) }));

  // espaçamentos e estilos
  const containerGap = 32;
  const barCardStyle: React.CSSProperties = {
    padding: 18,
    borderRadius: 12,
    border: "1px solid rgba(53,172,151,0.15)",
    background: "linear-gradient(180deg, rgba(243,252,250,1) 0%, rgba(236,252,250,1) 100%)",
  };

  const greenBackground = "#35ac97";
  const greenBorder = "1px solid rgba(0,0,0,0.06)";
  const lineCardStyle: React.CSSProperties = {
    padding: 18,
    borderRadius: 12,
    border: greenBorder,
    background: greenBackground,
    color: "#ffffff",
  };
  const pieCardStyle: React.CSSProperties = {
    padding: 18,
    borderRadius: 12,
    border: greenBorder,
    background: greenBackground,
    color: "#ffffff",
  };

  const chartItemColorOnGreen = "#dff6f1"; // cor dos itens sobre fundo verde

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: containerGap }}>
      {/* GRÁFICO 1 - BARRAS */}
      <div style={{ ...barCardStyle, height: 320 }}>
        <h4 style={{ margin: 0, marginBottom: 8, color: "#0b6b5e" }}>Produtos movimentados por mês ({year ?? new Date().getFullYear()})</h4>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="#dff6f1" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#2b6e62", fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: "#2b6e62", fontSize: 12 }} axisLine={false} />
              <Tooltip content={<ValueTooltip />} />
              <Legend verticalAlign="bottom" height={24} wrapperStyle={{ bottom: -6 }} />
              <Bar dataKey="total_itens" name="Produtos" fill="#35ac97" radius={[6,6,0,0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO 2 (LINHA) e GRÁFICO 3 (PIE) */}
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ ...lineCardStyle, flex: 1, minHeight: 260 }}>
          <h5 style={{ marginTop: 0, color: "#ffffff" }}>Faturamento por mês</h5>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#ffffff", fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: "#ffffff", fontSize: 12 }} axisLine={false} />
                <Tooltip content={<ValueTooltip />} formatter={(val:number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(val)} />
                <Line
                  type="monotone"
                  dataKey="faturamento"
                  stroke={chartItemColorOnGreen}
                  strokeWidth={2.8}
                  dot={{ r: 4, stroke: chartItemColorOnGreen, strokeWidth: 2, fill: "#ffffff" }}
                  activeDot={{ r: 6 }}
                />
                <Legend wrapperStyle={{ color: "#ffffff" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ ...pieCardStyle, width: 420, minHeight: 260 }}>
          <h5 style={{ marginTop: 0, color: "#ffffff" }}>Distribuição mensal</h5>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={28}
                  paddingAngle={2}
                  label={false}
                  labelLine={false}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COOL_COLORS[idx % COOL_COLORS.length]} stroke="rgba(255,255,255,0.06)" />
                  ))}
                </Pie>
                {/* Usamos o mesmo ValueTooltip (robusto) para garantir mês/exibição correta */}
                <Tooltip content={<ValueTooltip />} formatter={(val:number) => `${val} itens`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {loading && <div style={{ color: "#0b6b5e" }}>Carregando gráficos...</div>}
      {error && <div style={{ color: "crimson" }}>{String(error)}</div>}
    </div>
  );
}
