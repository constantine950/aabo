import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { fetchMetrics } from "../api";

interface Metrics {
  total_requests: number;
  blocked_requests: number;
  success_rate: number;
  requests_per_min: number;
  top_routes: { route: string; count: number; blocked: number }[];
  redis_memory: string;
}

const INTERVAL_MS = 10_000;

export default function MetricsChart() {
  const [data, setData] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const m = await fetchMetrics();
      setData(m);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  if (error) return <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>;
  if (!data) return <p style={{ color: "#555", fontSize: 13 }}>Loading...</p>;

  const stats = [
    { label: "Total requests", value: data.total_requests },
    { label: "Blocked", value: data.blocked_requests },
    { label: "Success rate", value: `${data.success_rate}%` },
    { label: "Requests / min", value: data.requests_per_min },
    { label: "Redis memory", value: data.redis_memory },
  ];

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h2 style={s.heading}>Metrics</h2>
        {lastUpdated && (
          <span style={s.updated}>
            updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div style={s.statGrid}>
        {stats.map((st) => (
          <div key={st.label} style={s.statCard}>
            <div style={s.statValue}>{st.value}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      <div style={s.chartWrap}>
        <p style={s.chartTitle}>Top routes</p>
        {data.top_routes.length === 0 ? (
          <p style={s.muted}>No route data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data.top_routes}
              margin={{ top: 8, right: 16, left: 0, bottom: 40 }}
            >
              <XAxis
                dataKey="route"
                tick={{ fill: "#555", fontSize: 12 }}
                angle={-25}
                textAnchor="end"
              />
              <YAxis tick={{ fill: "#555", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: 8,
                }}
                labelStyle={{ color: "#fff", fontSize: 13 }}
                itemStyle={{ color: "#ccc", fontSize: 12 }}
              />
              <Bar dataKey="count" name="allowed" radius={[4, 4, 0, 0]}>
                {data.top_routes.map((_, i) => (
                  <Cell key={i} fill="#4ade80" />
                ))}
              </Bar>
              <Bar dataKey="blocked" name="blocked" radius={[4, 4, 0, 0]}>
                {data.top_routes.map((_, i) => (
                  <Cell key={i} fill="#f87171" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", gap: 24 },
  header: { display: "flex", alignItems: "baseline", gap: 12 },
  heading: { fontSize: 18, fontWeight: 500, margin: 0 },
  updated: { fontSize: 12, color: "#555" },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 12,
  },
  statCard: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 10,
    padding: "14px 16px",
  },
  statValue: { fontSize: 22, fontWeight: 500, color: "#fff", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#555" },
  chartWrap: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 10,
    padding: "16px",
  },
  chartTitle: { fontSize: 13, color: "#888", marginBottom: 12, marginTop: 0 },
  muted: { color: "#555", fontSize: 13 },
};
