import { useEffect, useState } from "react";
import { fetchKeys, createKey, revokeKey } from "../api";

interface ApiKey {
  id: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
}

export default function ApiKeysPanel() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setKeys(await fetchKeys());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const res = await createKey(name.trim());
      setNewKey(res.key);
      setName("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this key?")) return;
    try {
      await revokeKey(id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div style={s.wrap}>
      <h2 style={s.heading}>API keys</h2>

      {newKey && (
        <div style={s.banner}>
          <span style={s.bannerLabel}>
            New key — copy it now, won't be shown again
          </span>
          <code style={s.code}>{newKey}</code>
          <button style={s.dismiss} onClick={() => setNewKey(null)}>
            dismiss
          </button>
        </div>
      )}

      {error && <p style={s.error}>{error}</p>}

      <div style={s.row}>
        <input
          style={s.input}
          placeholder="Key name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button style={s.btn} onClick={handleCreate}>
          Create
        </button>
      </div>

      {loading ? (
        <p style={s.muted}>Loading...</p>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              {["Name", "Status", "Created", ""].map((h) => (
                <th key={h} style={s.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} style={s.tr}>
                <td style={s.td}>{k.name ?? <span style={s.muted}>—</span>}</td>
                <td style={s.td}>
                  <span style={k.is_active ? s.active : s.inactive}>
                    {k.is_active ? "active" : "revoked"}
                  </span>
                </td>
                <td style={s.td}>
                  {new Date(k.created_at).toLocaleDateString()}
                </td>
                <td style={s.td}>
                  {k.is_active && (
                    <button style={s.revoke} onClick={() => handleRevoke(k.id)}>
                      revoke
                    </button>
                  )}
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
  row: { display: "flex", gap: 8 },
  input: {
    flex: 1,
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: "9px 12px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
  },
  btn: {
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: 8,
    padding: "9px 16px",
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 14,
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    color: "#555",
    fontWeight: 400,
    borderBottom: "1px solid #1e1e1e",
  },
  tr: { borderBottom: "1px solid #1a1a1a" },
  td: { padding: "10px 12px", color: "#ccc" },
  active: { color: "#4ade80", fontSize: 12 },
  inactive: { color: "#555", fontSize: 12 },
  revoke: {
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
  banner: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  bannerLabel: { fontSize: 12, color: "#888" },
  code: {
    fontSize: 13,
    color: "#fff",
    wordBreak: "break-all",
    fontFamily: "monospace",
  },
  dismiss: {
    background: "none",
    border: "none",
    color: "#555",
    cursor: "pointer",
    fontSize: 12,
    alignSelf: "flex-end",
  },
};
