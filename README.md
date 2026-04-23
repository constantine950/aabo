# Ààbò

Rate-limiting and abuse detection API that protects backend services from
excessive or malicious traffic using intelligent request control.

---

## What it does

- **Rate limiting** — per IP, API key, route, and user
- **Three algorithms** — sliding window, token bucket, fixed window
- **Abuse detection** — automatically flags and blocks bots, scrapers, and credential stuffers
- **Block / allow system** — TTL-based auto-expiring blocks with manual override
- **Request logging** — every request logged with IP, route, status, and response time
- **Metrics endpoint** — live traffic stats, block rate, top routes
- **Admin dashboard** — React UI for keys, logs, blocks, and charts

---

## Stack

| Layer          | Technology                            |
| -------------- | ------------------------------------- |
| Runtime        | Node.js + Express + TypeScript        |
| Counter store  | Redis (sorted sets, hashes, TTL keys) |
| Persistence    | PostgreSQL                            |
| Dashboard      | React + Vite + Recharts               |
| Infrastructure | Docker + Docker Compose               |

---

## Quick start

**Prerequisites:** Docker, Node.js 20+, npm

```bash
# 1. Clone and install
git clone https://github.com/your-username/aabo.git
cd aabo
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set API_KEY_SECRET to a long random string

# 3. Start Postgres and Redis
docker compose up postgres redis -d

# 4. Seed the first API key
npm run seed
# Copy the printed key — it won't be shown again

# 5. Start the server
npm run dev
```

Hit `http://localhost:3000/health` to confirm the server is running.

---

## Docker (full stack)

```bash
docker compose up --build
```

All three services — app, Postgres, Redis — start together. The app waits
for Postgres to pass its healthcheck before connecting.

---

## API reference

All endpoints require `x-api-key` or `Authorization: Bearer` header.

### Keys

| Method   | Path            | Description       |
| -------- | --------------- | ----------------- |
| `GET`    | `/api/keys`     | List all API keys |
| `POST`   | `/api/keys`     | Create a new key  |
| `DELETE` | `/api/keys/:id` | Revoke a key      |

### Rate limit config

| Method   | Path              | Description    |
| -------- | ----------------- | -------------- |
| `GET`    | `/api/limits`     | List all rules |
| `POST`   | `/api/limits`     | Create a rule  |
| `DELETE` | `/api/limits/:id` | Delete a rule  |

### Logs

| Method | Path        | Description                                       |
| ------ | ----------- | ------------------------------------------------- |
| `GET`  | `/api/logs` | Query request logs (filter by ip, route, blocked) |

### Blocks

| Method   | Path                       | Description              |
| -------- | -------------------------- | ------------------------ |
| `GET`    | `/api/blocks`              | List active blocks       |
| `POST`   | `/api/blocks`              | Manually block an entity |
| `DELETE` | `/api/blocks/:type/:value` | Unblock an entity        |

### Metrics

| Method | Path           | Description        |
| ------ | -------------- | ------------------ |
| `GET`  | `/api/metrics` | Live traffic stats |

---

## Response headers

Every rate-limited response includes:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 38
Retry-After: 38        (on 429 responses only)
```

---

## Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Open `http://localhost:5173`, enter your API key, and you're in.

---

## Algorithms

See [`docs/algorithms.md`](docs/algorithms.md) for a detailed breakdown of
sliding window, token bucket, and fixed window — including Redis operations,
tradeoffs, and when to use each.

---

## Simulate traffic

```bash
# Normal traffic — 50 requests across all routes
npm run simulate:traffic

# Attack simulation — burst, route scan, post-block check
npm run simulate:attack
```

Use a throwaway API key for attack simulations — the key will get blocked.

---

## Project structure

```
src/
├── config/         Redis and Postgres client setup
├── middleware/      Auth, logger, rate limiter, abuse detector, error handler
├── limiters/        Fixed window, sliding window, token bucket
├── detection/       Abuse rules, engine, blocker, alerts
├── routes/          API endpoint handlers
├── models/          Postgres query helpers
├── services/        Redis service, key service, metrics service
├── types/           Shared TypeScript interfaces
├── app.ts           Express app + middleware pipeline
└── server.ts        Entry point
dashboard/           React + Vite admin UI
db/                  Schema, migrations, seed script
docs/                PRD, architecture, algorithms
scripts/             Traffic simulation tools
```
