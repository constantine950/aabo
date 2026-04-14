import { useEffect, useState } from "react";
import { fetchBlocks, unblock } from "../api";

interface Block {
  id: string;
  entity_type: string;
  entity_value: string;
  reason: string;
  blocked_by: string;
  expires_at: string | null;
}

export default function BlocksPanel() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setBlocks(await fetchBlocks());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUnblock = async (type: string, value: string) => {
    if (!confirm(`Unblock ${type}:${value}?`)) return;
    try {
      await unblock(type, value);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const formatExpiry = (expires_at: string | null): string => {
    if (!expires_at) return "permanent";
    const d = new Date(expires_at);
    const diff = Math.round((d.getTime() - Date.now()) / 1000);
    if (diff <= 0) return "expired";
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.round(diff / 60)}m`;
    return `${Math.round(diff / 3600)}h`;
  };

  return (
    <div style={s.wrap}>
      <h2 style={s.heading}>Blocked entities</h2>

      {error && <p style={s.error}>{error}</p>}

      {loading ? (
        <p style={s.muted}>Loading...</p>
      ) : blocks.length === 0 ? (
        <p style={s.muted}>No active blocks.</p>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              {["Type", "Value", "Reason", "By", "Expires", ""].map((h) => (
                <th key={h} style={s.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {blocks.map((b) => (
              <tr key={b.id} style={s.tr}>
                <td style={s.td}>
                  <span style={s.typeBadge}>{b.entity_type}</span>
                </td>
                <td style={s.td}>
                  <code style={s.code}>{b.entity_value}</code>
                </td>
                <td style={s.td}>
                  <span style={s.reason}>{b.reason}</span>
                </td>
                <td style={s.td}>
                  <span style={b.blocked_by === "system" ? s.system : s.manual}>
                    {b.blocked_by}
                  </span>
                </td>
                <td style={s.td}>
                  <span style={s.expiry}>{formatExpiry(b.expires_at)}</span>
                </td>
                <td style={s.td}>
                  <button
                    style={s.unblockBtn}
                    onClick={() => handleUnblock(b.entity_type, b.entity_value)}
                  >
                    unblock
                  </button>
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
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    color: "#555",
    fontWeight: 400,
    borderBottom: "1px solid #1e1e1e",
  },
  tr: { borderBottom: "1px solid #1a1a1a" },
  td: { padding: "10px 12px", color: "#ccc" },
  typeBadge: {
    background: "rgba(248,113,113,0.12)",
    color: "#f87171",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 4,
  },
  code: { fontFamily: "monospace", fontSize: 12, color: "#fff" },
  reason: { color: "#888", fontSize: 12 },
  system: { color: "#f87171", fontSize: 12 },
  manual: { color: "#facc15", fontSize: 12 },
  expiry: { color: "#888", fontSize: 12, fontFamily: "monospace" },
  unblockBtn: {
    background: "none",
    border: "1px solid #333",
    borderRadius: 6,
    color: "#888",
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: 12,
  },
  muted: { color: "#555", fontSize: 13 },
  error: { color: "#f87171", fontSize: 13 },
};
