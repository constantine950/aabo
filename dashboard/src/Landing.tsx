interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        a { color: inherit; text-decoration: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
      `}</style>

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navLogo}>Ààbò</div>
        <div style={s.navLinks}>
          <a href="#how" style={s.navLink}>
            How it works
          </a>
          <a href="#algorithms" style={s.navLink}>
            Algorithms
          </a>
          <a href="#rules" style={s.navLink}>
            Detection
          </a>
        </div>
        <button style={s.navCta} onClick={onGetStarted}>
          Open dashboard
        </button>
      </nav>

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.grid} />
        <p style={s.eyebrow}>Rate limiting · Abuse detection · Node.js</p>
        <h1 style={s.heroTitle}>
          Protect your API from{" "}
          <em style={{ fontStyle: "italic", color: "#c8f135" }}>everything</em>{" "}
          that shouldn't reach it
        </h1>
        <p style={s.heroSub}>
          Ààbò is Express middleware that rate-limits, detects abuse, and blocks
          bad actors — automatically, in milliseconds, before they touch your
          routes.
        </p>
        <div style={s.heroActions}>
          <button style={s.btnPrimary} onClick={onGetStarted}>
            Open dashboard
          </button>
          <a href="#how" style={s.btnSecondary}>
            See how it works
          </a>
        </div>

        {/* Terminal */}
        <div style={s.terminal}>
          <div style={s.termBar}>
            <div style={{ ...s.dot, background: "#ff5f57" }} />
            <div style={{ ...s.dot, background: "#ffbd2e" }} />
            <div style={{ ...s.dot, background: "#28c840" }} />
          </div>
          <div style={s.termBody}>
            <div>
              <span style={s.tDim}>$ </span>
              <span style={s.tCmd}>
                curl /api/data -H "x-api-key: aabo_..."
              </span>
            </div>
            <div>
              <span style={s.tInfo}>→ </span>
              <span style={s.tCmd}>Auth ✓ Logger ✓ Limiter ✓ Detector ✓</span>
            </div>
            <div>
              <span style={s.tOk}>200 OK</span>
              <span style={s.tDim}> — 4ms remaining: 94/100</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={s.tDim}>$ </span>
              <span style={s.tCmd}># 200 requests later...</span>
            </div>
            <div>
              <span style={s.tWarn}>403 Blocked</span>
              <span style={s.tDim}> — suspicious_route_scan</span>
            </div>
            <div>
              <span style={s.tDim}>→ blocked until 2026-05-06T10:55:43Z</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={s.statsSection}>
        {[
          { num: "3×", label: "algorithms built-in" },
          { num: "5×", label: "abuse detection rules" },
          { num: "<1ms", label: "Redis block check" },
          { num: "0×", label: "restarts to update limits" },
        ].map((st) => (
          <div key={st.label}>
            <div style={s.statNum}>{st.num}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <section style={s.section} id="how">
        <p style={s.sectionLabel}>How it works</p>
        <h2 style={s.sectionTitle}>
          Every request passes through the pipeline
        </h2>
        <p style={s.sectionSub}>
          Drop Ààbò into your Express app. Every incoming request flows through
          five layers before reaching your route handler.
        </p>
        <div style={s.pipeline}>
          {[
            { name: "Request", desc: "incoming", accent: false },
            { name: "Auth", desc: "validate key", accent: false },
            { name: "Logger", desc: "record it", accent: false },
            { name: "Limiter", desc: "check rate", accent: true },
            { name: "Detector", desc: "check abuse", accent: true },
            { name: "Route", desc: "your handler", accent: false },
          ].map((step, i, arr) => (
            <div
              key={step.name}
              style={{ display: "flex", alignItems: "center", gap: 0 }}
            >
              <div
                style={{
                  ...s.pipeStep,
                  ...(step.accent ? s.pipeStepAccent : {}),
                }}
              >
                <div
                  style={{
                    ...s.pipeStepName,
                    ...(step.accent ? { color: "#c8f135" } : {}),
                  }}
                >
                  {step.name}
                </div>
                <div style={s.pipeStepDesc}>{step.desc}</div>
              </div>
              {i < arr.length - 1 && <div style={s.pipeArrow}>→</div>}
            </div>
          ))}
        </div>
        <p style={s.pipeNote}>
          → Redis fails? Fail open. Detection errors? Fail open. Your traffic
          always keeps moving.
        </p>
      </section>

      {/* Algorithms */}
      <section
        style={{ ...s.section, borderTop: "1px solid #1c1c1c" }}
        id="algorithms"
      >
        <p style={s.sectionLabel}>Algorithms</p>
        <h2 style={s.sectionTitle}>Pick the right tool for the endpoint</h2>
        <p style={s.sectionSub}>
          Set the algorithm per API key, route, IP, or user. Config lives in
          Postgres — change a row, the next request picks it up.
        </p>
        <div style={s.algoGrid}>
          {[
            {
              tag: "sliding_window",
              name: "Sliding window",
              desc: "Tracks exact timestamps in a Redis sorted set. No boundary burst problem. The limit is always enforced over the true last N seconds.",
              rows: [
                ["accuracy", "high", true],
                ["burst handling", "moderate", false],
                ["Redis ops", "3–4", false],
              ],
            },
            {
              tag: "token_bucket",
              name: "Token bucket",
              desc: "Tokens refill at a fixed rate. Clients can burst up to capacity then sustain at the refill rate. State is two fields in a Redis hash.",
              rows: [
                ["accuracy", "high", true],
                ["burst handling", "excellent", true],
                ["Redis ops", "3", false],
              ],
            },
            {
              tag: "fixed_window",
              name: "Fixed window",
              desc: "Counts requests per time bucket. Simple and low overhead — good for internal tooling where precision matters less than simplicity.",
              rows: [
                ["accuracy", "low", false],
                ["burst handling", "poor", false],
                ["Redis ops", "2", false],
              ],
            },
          ].map((algo) => (
            <div key={algo.tag} style={s.algoCard}>
              <div style={s.algoTag}>{algo.tag}</div>
              <div style={s.algoName}>{algo.name}</div>
              <div style={s.algoDesc}>{algo.desc}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {algo.rows.map(([label, val, good]) => (
                  <div
                    key={String(label)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  >
                    <span style={{ color: "#666" }}>{label}</span>
                    <span style={{ color: good ? "#c8f135" : "#ccc" }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Detection rules */}
      <section style={s.section} id="rules">
        <p style={s.sectionLabel}>Abuse detection</p>
        <h2 style={s.sectionTitle}>
          Five rules. Automatic blocks. Zero config.
        </h2>
        <p style={s.sectionSub}>
          The detection engine evaluates every request. First match blocks the
          entity in Redis and writes an audit record to Postgres.
        </p>
        <div style={s.rulesList}>
          {[
            {
              name: "too_many_requests",
              desc: "Volume spike — likely a script or bot",
              threshold: "200 reqs",
              window: "60s",
              block: "5 min",
            },
            {
              name: "repeated_auth_failures",
              desc: "Invalid keys — likely credential stuffing",
              threshold: "10 fails",
              window: "5 min",
              block: "10 min",
            },
            {
              name: "suspicious_route_scan",
              desc: "Many distinct routes — likely endpoint probing",
              threshold: "30 routes",
              window: "60s",
              block: "5 min",
            },
            {
              name: "high_error_rate",
              desc: "Excessive 4xx/5xx responses",
              threshold: "50 errors",
              window: "60s",
              block: "3 min",
            },
            {
              name: "rapid_ip_rotation",
              desc: "Same key, many IPs — likely key sharing",
              threshold: "10 IPs",
              window: "5 min",
              block: "10 min",
            },
          ].map((rule) => (
            <div key={rule.name} style={s.ruleRow}>
              <div>
                <div style={s.ruleName}>{rule.name}</div>
                <div style={s.ruleDesc}>{rule.desc}</div>
              </div>
              <div style={s.ruleVal}>{rule.threshold}</div>
              <div style={s.ruleVal}>{rule.window}</div>
              <div style={s.ruleVal}>{rule.block}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div style={s.ctaSection}>
        <h2 style={s.ctaTitle}>Ready to protect your API?</h2>
        <p style={s.ctaSub}>Enter your API key and get started in seconds.</p>
        <button
          style={{ ...s.btnPrimary, fontSize: 16, padding: "14px 36px" }}
          onClick={onGetStarted}
        >
          Open dashboard
        </button>
        <p
          style={{
            marginTop: "1.25rem",
            fontSize: 13,
            color: "#3a3a3a",
            fontFamily: "IBM Plex Mono, monospace",
          }}
        >
          Don't have a key? Contact your administrator.
        </p>
      </div>

      {/* Footer */}
      <footer style={s.footer}>
        <div
          style={{ fontFamily: "Fraunces, serif", fontSize: 15, color: "#555" }}
        >
          Ààbò
        </div>
        <div style={{ color: "#3a3a3a", fontSize: 13 }}>
          Node.js · TypeScript · Redis · PostgreSQL
        </div>
      </footer>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: {
    background: "#080808",
    color: "#f5f5f5",
    fontFamily: "Inter, system-ui, sans-serif",
    minHeight: "100vh",
    overflowX: "hidden",
  },
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 2rem",
    height: 56,
    borderBottom: "1px solid #1c1c1c",
    background: "rgba(8,8,8,0.9)",
    backdropFilter: "blur(12px)",
  },
  navLogo: { fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 600 },
  navLinks: { display: "flex", gap: "2rem", fontSize: 13, color: "#666" },
  navLink: { color: "#666", cursor: "pointer" },
  navCta: {
    background: "#c8f135",
    color: "#080808",
    fontSize: 13,
    fontWeight: 500,
    padding: "7px 16px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
  },
  hero: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "8rem 2rem 6rem",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(#1c1c1c 1px, transparent 1px), linear-gradient(90deg, #1c1c1c 1px, transparent 1px)",
    backgroundSize: "48px 48px",
    WebkitMaskImage:
      "radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent)",
    opacity: 0.4,
  },
  eyebrow: {
    fontFamily: "IBM Plex Mono, monospace",
    fontSize: 11,
    color: "#c8f135",
    letterSpacing: ".12em",
    textTransform: "uppercase",
    marginBottom: "1.5rem",
    position: "relative",
  },
  heroTitle: {
    fontFamily: "Fraunces, serif",
    fontSize: "clamp(40px, 7vw, 88px)",
    fontWeight: 300,
    lineHeight: 1.05,
    maxWidth: 900,
    marginBottom: "1.5rem",
    position: "relative",
  },
  heroSub: {
    fontSize: 17,
    color: "#999",
    maxWidth: 520,
    marginBottom: "3rem",
    fontWeight: 300,
    lineHeight: 1.7,
    position: "relative",
  },
  heroActions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
    position: "relative",
  },
  btnPrimary: {
    background: "#c8f135",
    color: "#080808",
    fontWeight: 500,
    fontSize: 14,
    padding: "12px 28px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  btnSecondary: {
    background: "transparent",
    color: "#ccc",
    fontSize: 14,
    padding: "12px 28px",
    borderRadius: 8,
    border: "1px solid #3a3a3a",
    cursor: "pointer",
    display: "inline-block",
  },
  terminal: {
    width: "100%",
    maxWidth: 560,
    marginTop: "4rem",
    background: "#111",
    border: "1px solid #1c1c1c",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  termBar: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 14px",
    borderBottom: "1px solid #1c1c1c",
  },
  dot: { width: 10, height: 10, borderRadius: "50%" },
  termBody: {
    padding: "16px 20px",
    fontFamily: "IBM Plex Mono, monospace",
    fontSize: 13,
    lineHeight: 2,
  },
  tDim: { color: "#3a3a3a" },
  tCmd: { color: "#f5f5f5" },
  tOk: { color: "#c8f135" },
  tWarn: { color: "#f13535" },
  tInfo: { color: "#60a5fa" },
  statsSection: {
    borderTop: "1px solid #1c1c1c",
    borderBottom: "1px solid #1c1c1c",
    padding: "5rem 2rem",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "3rem",
    maxWidth: 1100,
    margin: "0 auto",
  },
  statNum: {
    fontFamily: "Fraunces, serif",
    fontSize: 52,
    fontWeight: 300,
    color: "#f5f5f5",
    lineHeight: 1,
    marginBottom: ".5rem",
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
    fontFamily: "IBM Plex Mono, monospace",
  },
  section: { padding: "6rem 2rem", maxWidth: 1100, margin: "0 auto" },
  sectionLabel: {
    fontFamily: "IBM Plex Mono, monospace",
    fontSize: 11,
    color: "#3a3a3a",
    letterSpacing: ".1em",
    textTransform: "uppercase",
    marginBottom: "1rem",
  },
  sectionTitle: {
    fontFamily: "Fraunces, serif",
    fontSize: "clamp(28px, 4vw, 44px)",
    fontWeight: 300,
    lineHeight: 1.15,
    color: "#f5f5f5",
    marginBottom: "1rem",
  },
  sectionSub: {
    fontSize: 16,
    color: "#999",
    maxWidth: 540,
    fontWeight: 300,
    lineHeight: 1.7,
  },
  pipeline: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    margin: "3rem 0 1rem",
    overflowX: "auto",
  },
  pipeStep: {
    background: "#111",
    border: "1px solid #1c1c1c",
    borderRadius: 8,
    padding: "14px 18px",
    textAlign: "center",
    minWidth: 100,
  },
  pipeStepAccent: { borderColor: "#c8f135" },
  pipeStepName: {
    fontSize: 13,
    fontWeight: 500,
    color: "#f5f5f5",
    marginBottom: 4,
  },
  pipeStepDesc: {
    fontSize: 11,
    color: "#3a3a3a",
    fontFamily: "IBM Plex Mono, monospace",
  },
  pipeArrow: { color: "#3a3a3a", fontSize: 18, padding: "0 4px" },
  pipeNote: {
    fontFamily: "IBM Plex Mono, monospace",
    fontSize: 12,
    color: "#3a3a3a",
    marginTop: "1rem",
  },
  algoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 1,
    background: "#1c1c1c",
    border: "1px solid #1c1c1c",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: "3rem",
  },
  algoCard: { background: "#111", padding: "2rem" },
  algoTag: {
    fontFamily: "IBM Plex Mono, monospace",
    fontSize: 10,
    color: "#3a3a3a",
    letterSpacing: ".1em",
    textTransform: "uppercase",
    marginBottom: "1rem",
  },
  algoName: {
    fontFamily: "Fraunces, serif",
    fontSize: 22,
    fontWeight: 300,
    color: "#f5f5f5",
    marginBottom: ".75rem",
  },
  algoDesc: {
    fontSize: 14,
    color: "#999",
    lineHeight: 1.6,
    marginBottom: "1.5rem",
  },
  rulesList: {
    marginTop: "3rem",
    display: "flex",
    flexDirection: "column",
    gap: 1,
    background: "#1c1c1c",
    border: "1px solid #1c1c1c",
    borderRadius: 12,
    overflow: "hidden",
  },
  ruleRow: {
    display: "grid",
    gridTemplateColumns: "1fr 100px 80px 80px",
    gap: "1rem",
    alignItems: "center",
    background: "#111",
    padding: "1.25rem 1.5rem",
  },
  ruleName: {
    fontFamily: "IBM Plex Mono, monospace",
    fontSize: 13,
    color: "#c8f135",
  },
  ruleDesc: { fontSize: 13, color: "#999", marginTop: 3 },
  ruleVal: {
    fontFamily: "IBM Plex Mono, monospace",
    fontSize: 13,
    color: "#ccc",
    textAlign: "right",
  },
  ctaSection: {
    textAlign: "center",
    padding: "8rem 2rem",
    borderTop: "1px solid #1c1c1c",
  },
  ctaTitle: {
    fontFamily: "Fraunces, serif",
    fontSize: "clamp(32px, 5vw, 60px)",
    fontWeight: 300,
    color: "#f5f5f5",
    marginBottom: "1rem",
    lineHeight: 1.1,
  },
  ctaSub: {
    fontSize: 16,
    color: "#999",
    marginBottom: "2.5rem",
    fontWeight: 300,
  },
  footer: {
    borderTop: "1px solid #1c1c1c",
    padding: "2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 1100,
    margin: "0 auto",
  },
};
