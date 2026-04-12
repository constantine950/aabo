import { useState } from "react";
import { setApiKey, getApiKey } from "./api";

type Tab = "metrics" | "keys" | "logs" | "blocks";

const tabs: Tab[] = ["metrics", "keys", "logs", "blocks"];

export default function App() {
  const [key, setKey] = useState(getApiKey());
  const [authed, setAuthed] = useState(!!getApiKey());
  const [tab, setTab] = useState<Tab>("metrics");
  const [input, setInput] = useState("");

  const handleAuth = () => {
    setApiKey(input.trim());
    setKey(input.trim());
    setAuthed(true);
  };

  if (!authed || !key) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h2 style={styles.title}>Ààbò</h2>
          <p style={styles.sub}>Enter your API key to continue</p>
          <input
            style={styles.input}
            type="text"
            placeholder="aabo_..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
          />
          <button style={styles.btn} onClick={handleAuth}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>Ààbò</div>
        {tabs.map((t) => (
          <button
            key={t}
            style={{ ...styles.navBtn, ...(tab === t ? styles.navActive : {}) }}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
        <button
          style={{ ...styles.navBtn, marginTop: "auto" }}
          onClick={() => {
            setAuthed(false);
            setApiKey("");
            setKey("");
          }}
        >
          sign out
        </button>
      </aside>
      <main style={styles.main}>
        {/* panels added day by day */}
        <p style={{ color: "#888" }}>{tab} panel — coming in Days 22–25</p>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#0f0f0f",
  },
  card: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    padding: "2rem",
    width: 340,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  title: { margin: 0, fontSize: 22, fontWeight: 500, color: "#fff" },
  sub: { margin: 0, fontSize: 13, color: "#888" },
  input: {
    background: "#111",
    border: "1px solid #333",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
  },
  btn: {
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: 8,
    padding: "10px 0",
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 14,
  },
  shell: {
    display: "flex",
    height: "100vh",
    background: "#0f0f0f",
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
  },
  sidebar: {
    width: 180,
    borderRight: "1px solid #1e1e1e",
    padding: "1.5rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  logo: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: "1.5rem",
    color: "#fff",
  },
  navBtn: {
    background: "none",
    border: "none",
    color: "#888",
    textAlign: "left",
    padding: "8px 10px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    textTransform: "capitalize",
  },
  navActive: { background: "#1e1e1e", color: "#fff" },
  main: { flex: 1, padding: "2rem", overflowY: "auto" },
};
