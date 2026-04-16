import dotenv from "dotenv";
dotenv.config();

const API = process.env.API_URL ?? "http://localhost:3000";
const API_KEY = process.env.TEST_API_KEY ?? "";

if (!API_KEY) {
  console.error("TEST_API_KEY is not set in .env");
  process.exit(1);
}

const ROUTES = ["/api/keys", "/api/metrics", "/api/logs", "/api/blocks"];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const request = async (route: string): Promise<number> => {
  const res = await fetch(`${API}${route}`, {
    headers: { "x-api-key": API_KEY },
  });
  return res.status;
};

const simulate = async (total: number, delayMs: number) => {
  console.log(
    `[traffic] sending ${total} requests with ${delayMs}ms delay...\n`,
  );
  const results = { ok: 0, limited: 0, blocked: 0, other: 0 };

  for (let i = 0; i < total; i++) {
    const route = ROUTES[i % ROUTES.length];
    const status = await request(route);

    if (status === 200) results.ok++;
    else if (status === 429) results.limited++;
    else if (status === 403) results.blocked++;
    else results.other++;

    process.stdout.write(
      `\r[traffic] ${i + 1}/${total} — 200:${results.ok} 429:${results.limited} 403:${results.blocked}`,
    );
    await sleep(delayMs);
  }

  console.log("\n\n[traffic] done.", results);
};

simulate(50, 200).catch(console.error);
