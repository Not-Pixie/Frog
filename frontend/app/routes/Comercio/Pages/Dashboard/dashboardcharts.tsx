import React, { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useParams } from "react-router";
import { fetchMovimentacoesMensais } from "src/helpers";

const COLORS = ["#2ca02c","#98df8a","#ff7f0e","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf","#1f77b4","#aec7e8"];

export default function DashboardCharts({ year }: { year?: number }) {
  const { comercioId } = useParams() as { comercioId?: string };
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // fetch all movimentacoes (closed) for the year. For the line (faturamento) we'll call tipo=saida separately.
  useEffect(() => {
    if (!comercioId) return;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // fetch all types to populate total_itens bar and pie
        const resAll = await fetchMovimentacoesMensais(Number(comercioId), year, "all");
        // fetch only 'saida' closed to ensure faturamento (you could also take valor_total from resAll if includes saida, but safe to request)
        const resSaidas = await fetchMovimentacoesMensais(Number(comercioId), year, "saida");

        // prefer resAll.data (contains total_itens per month and valor_total for all types), but faturamento should come from resSaidas
        const arrAll = resAll?.data ?? [];
        const arrSaidas = resSaidas?.data ?? [];

        // merge into a single dataset keyed by month
        const merged = arrAll.map((m: any, idx: number) => {
          const mSaida = (arrSaidas.find((s: any) => s.month === m.month) || {});
          return {
            month: m.month,
            name: m.label,
            total_itens: m.total_itens ?? 0,
            valor_total_all: m.valor_total ?? 0,
            mov_count_all: m.mov_count ?? 0,
            faturamento: mSaida.valor_total ?? 0,
            mov_count_saidas: mSaida.mov_count ?? 0
          };
        });

        setData(merged);
      } catch (err: any) {
        console.error("Erro ao carregar dados do dashboard (charts):", err);
        setError(err?.message ?? "Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    })();
  }, [comercioId, year]);

  // prepare datasets
  const barData = data.map(d => ({ name: d.name, total_itens: d.total_itens }));
  const lineData = data.map(d => ({ name: d.name, faturamento: Number(d.faturamento ?? 0) }));
  const pieData = data.map(d => ({ name: d.name, value: Number(d.total_itens ?? 0) }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ height: 320, padding: 12, borderRadius: 10, border: "1px solid #d6efe8", background: "#f3fcfa" }}>
        <h4 style={{ marginTop: 0 }}>Produtos movimentados por mês ({year ?? new Date().getFullYear()})</h4>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_itens" name="Produtos" fill="#2ca02c" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1, height: 260, padding: 12, borderRadius: 10, border: "1px solid #d6efe8", background: "#f3fcfa" }}>
          <h5 style={{ marginTop: 0 }}>Faturamento (saídas fechadas) por mês</h5>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(val:number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(val)} />
              <Line type="monotone" dataKey="faturamento" stroke="#35ac97" name="Faturamento (R$)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ width: 420, height: 260, padding: 12, borderRadius: 10, border: "1px solid #d6efe8", background: "#f3fcfa" }}>
          <h5 style={{ marginTop: 0 }}>Distribuição mensal (pizza)</h5>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {pieData.map((entry, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {loading && <div>Carregando gráficos...</div>}
      {error && <div style={{ color: "crimson" }}>{String(error)}</div>}
    </div>
  );
}

