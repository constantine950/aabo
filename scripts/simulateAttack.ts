import dotenv from "dotenv";
dotenv.config();

const API = process.env.API_URL ?? "http://localhost:3000";
const API_KEY = process.env.TEST_API_KEY ?? "";

if (!API_KEY) {
  console.error("TEST_API_KEY is not set in .env");
  process.exit(1);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const request = async (route: string): Promise<number> => {
  const res = await fetch(`${API}${route}`, {
    headers: { "x-api-key": API_KEY },
  });
  return res.status;
};

// Phase 1 — rapid burst to trigger rate limiting
const burstPhase = async () => {
  console.log("[attack] phase 1: burst (120 requests, no delay)");
  const results = { ok: 0, limited: 0, blocked: 0 };

  for (let i = 0; i < 120; i++) {
    const status = await request("/api/keys");
    if (status === 200) results.ok++;
    else if (status === 429) results.limited++;
    else if (status === 403) results.blocked++;
    process.stdout.write(
      `\r[attack] ${i + 1}/120 — 200:${results.ok} 429:${results.limited} 403:${results.blocked}`,
    );
  }
  console.log("\n[attack] phase 1 done.", results);
};

// Phase 2 — route scan to trigger suspicious_route_scan rule
const scanPhase = async () => {
  console.log("\n[attack] phase 2: route scan (35 distinct routes)");
  const results = { ok: 0, limited: 0, blocked: 0 };

  for (let i = 0; i < 35; i++) {
    const status = await request(`/api/probe-${i}`);
    if (status === 200) results.ok++;
    else if (status === 429) results.limited++;
    else if (status === 403) results.blocked++;
    await sleep(50);
    process.stdout.write(`\r[attack] ${i + 1}/35`);
  }
  console.log("\n[attack] phase 2 done.", results);
};

// Phase 3 — continued requests after block to confirm blocking works
const postBlockPhase = async () => {
  console.log("\n[attack] phase 3: post-block check (5 requests)");
  for (let i = 0; i < 5; i++) {
    const status = await request("/api/keys");
    console.log(`[attack] request ${i + 1}: ${status}`);
    await sleep(200);
  }
};

const attack = async () => {
  console.log("[attack] starting simulation...\n");
  await burstPhase();
  await sleep(500);
  await scanPhase();
  await sleep(500);
  await postBlockPhase();
  console.log("\n[attack] simulation complete. check your dashboard.");
};

attack().catch(console.error);
