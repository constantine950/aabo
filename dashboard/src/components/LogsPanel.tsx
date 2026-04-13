import { useEffect, useState } from "react";
import { fetchLogs } from "../api";

interface Log {
  id: string;
  ip: string;
  route: string;
  method: string;
  status_code: number;
  blocked: boolean;
  response_ms: number;
  created_at: string;
}

export default function LogsPanel() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ ip: "", route: "", blocked: "" });

  const load = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filters.ip) params.ip = filters.ip;
      if (filters.route) params.route = filters.route;
      if (filters.blocked) params.blocked = filters.blocked;
      setLogs(await fetchLogs(params));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const statusColor = (code: number): string => {
    if (code < 300) return "#4ade80";
    if (code < 400) return "#facc15";
    return "#f87171";
  };

  return (
    <div style={s.wrap}>
      <h2 style={s.heading}>Request logs</h2>

      {error && <p style={s.error}>{error}</p>}

      <div style={s.filters}>
        <input
          style={s.input}
          placeholder="Filter by IP"
          value={filters.ip}
          onChange={(e) => setFilters((f) => ({ ...f, ip: e.target.value }))}
        />
        <input
          style={s.input}
          placeholder="Filter by route"
          value={filters.route}
          onChange={(e) => setFilters((f) => ({ ...f, route: e.target.value }))}
        />
        <select
          style={s.select}
          value={filters.blocked}
          onChange={(e) =>
            setFilters((f) => ({ ...f, blocked: e.target.value }))
          }
        >
          <option value="">All</option>
          <option value="true">Blocked only</option>
          <option value="false">Allowed only</option>
        </select>
        <button style={s.btn} onClick={load}>
          Apply
        </button>
      </div>

      {loading ? (
        <p style={s.muted}>Loading...</p>
      ) : logs.length === 0 ? (
        <p style={s.muted}>No logs found.</p>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              {["Time", "Method", "Route", "IP", "Status", "Ms", "Blocked"].map(
                (h) => (
                  <th key={h} style={s.th}>
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr
                key={l.id}
                style={{ ...s.tr, ...(l.blocked ? s.blockedRow : {}) }}
              >
                <td style={s.td}>
                  {new Date(l.created_at).toLocaleTimeString()}
                </td>
                <td style={s.td}>
                  <span style={s.method}>{l.method}</span>
                </td>
                <td style={s.td}>{l.route}</td>
                <td style={s.td}>{l.ip}</td>
                <td style={s.td}>
                  <span style={{ color: statusColor(l.status_code) }}>
                    {l.status_code}
                  </span>
                </td>
                <td style={s.td}>{l.response_ms}</td>
                <td style={s.td}>
                  {l.blocked && <span style={s.blockedBadge}>blocked</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", gap: 16 },
  heading: { fontSize: 18, fontWeight: 500, margin: 0 },
  filters: { display: "flex", gap: 8, flexWrap: "wrap" },
  input: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#fff",
    fontSize: 13,
    outline: "none",
    width: 160,
  },
  select: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#fff",
    fontSize: 13,
    outline: "none",
  },
  btn: {
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 13,
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    color: "#555",
    fontWeight: 400,
    borderBottom: "1px solid #1e1e1e",
  },
  tr: { borderBottom: "1px solid #1a1a1a" },
  blockedRow: { background: "rgba(248,113,113,0.04)" },
  td: { padding: "9px 12px", color: "#ccc" },
  method: { fontSize: 11, color: "#888", fontFamily: "monospace" },
  blockedBadge: {
    background: "rgba(248,113,113,0.15)",
    color: "#f87171",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 4,
  },
  muted: { color: "#555", fontSize: 13 },
  error: { color: "#f87171", fontSize: 13 },
};
