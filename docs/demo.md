# Ààbò — Demo Script

## Setup

Make sure everything is running before starting:

```bash
# Terminal 1 — backend
docker compose up --build

# Terminal 2 — dashboard
cd dashboard && npm run dev
```

Open two windows side by side:

- **Dashboard** → `http://localhost:5173`
- **Terminal** → for running curl commands and scripts

---

## Scene 1 — The system at rest

Open the dashboard and walk through each panel.

**Metrics tab**

- Total requests, blocked count, success rate all visible
- Auto-refreshes every 10 seconds
- Redis memory shown

**Keys tab**

- Your admin key listed as active
- Demonstrate creating a new key — raw key shown once, then gone

**Logs tab**

- Every request recorded — method, route, IP, status, response time
- Filter by blocked to show only rejected requests

**Blocks tab**

- Empty — no active blocks yet

---

## Scene 2 — Normal traffic

Open a new terminal and run:

```bash
npm run simulate:traffic
```

Watch the dashboard as it runs:

- Metrics panel — `requests_per_min` climbs
- Logs panel — new rows appear, all green `200`
- Top routes bar chart — `/api/keys`, `/api/metrics`, `/api/logs`, `/api/blocks` all showing traffic

Expected output in terminal:

```
[traffic] sending 50 requests with 200ms delay...
[traffic] 50/50 — 200:50 429:0 403:0
[traffic] done.
```

---

## Scene 3 — Rate limiting in action

Send a burst of requests past the limit:

```bash
for i in {1..105}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/keys \
    -H "x-api-key: YOUR_API_KEY"
done
```

Point out:

- First 99 requests → `200`
- Request 100+ → `429 Too Many Requests`
- Check response headers on a single request:

```bash
curl -v http://localhost:3000/api/keys \
  -H "x-api-key: YOUR_API_KEY" 2>&1 | grep -E "X-RateLimit|Retry-After"
```

Expected headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 42
Retry-After: 42
```

Flush Redis to reset counters:

```bash
docker exec -it aabo_redis redis-cli FLUSHALL
```

---

## Scene 4 — Abuse detection and automatic blocking

> Use a throwaway API key for this scene so your admin key stays clean.

```bash
npm run simulate:attack
```

The script runs three phases — narrate each one:

**Phase 1 — Burst (120 requests, no delay)**

- First ~99 requests allowed
- Rate limiter fires → `429`
- Detection engine fires → `403 Blocked due to suspicious activity`
- Watch blocks panel — IP appears automatically

**Phase 2 — Route scan (35 distinct routes)**

- `suspicious_route_scan` rule fires
- Additional block written to both Redis and Postgres

**Phase 3 — Post-block check (5 requests)**

- All `403 Blocked` — fast rejection, never reaches the engine
- This is the Redis block check firing, not the detection engine

Expected terminal output:

```
[attack] phase 1: burst (120 requests, no delay)
[attack] 120/120 — 200:99 429:1 403:20
[attack] phase 1 done.

[attack] phase 2: route scan (35 distinct routes)
[attack] phase 2 done.

[attack] phase 3: post-block check (5 requests)
[attack] request 1: 403
[attack] request 2: 403
...
[attack] simulation complete. check your dashboard.
```

---

## Scene 5 — Dashboard after the attack

Switch to the dashboard:

**Metrics tab**

- `blocked_requests` is now non-zero
- `success_rate` dropped below 100%
- Bar chart shows red blocked bars alongside green allowed bars

**Logs tab**

- Filter by `Blocked only`
- See all the `403` and `429` entries with response times

**Blocks tab**

- Blocked IP listed with:
  - Rule that triggered it
  - `blocked_by: system`
  - Expiry countdown ticking down

---

## Scene 6 — Manual unblock and recovery

Unblock the IP from the dashboard:

- Go to Blocks tab
- Click **unblock** on the blocked IP

Or via API:

```bash
curl -X DELETE http://localhost:3000/api/blocks/ip/YOUR_IP \
  -H "x-api-key: YOUR_API_KEY"
```

Then flush Redis to clear rate limit counters:

```bash
docker exec -it aabo_redis redis-cli FLUSHALL
```

Run normal traffic again to show recovery:

```bash
npm run simulate:traffic
```

All `200` — system is clean.

---

## Scene 7 — Dynamic config (bonus)

Show that limits are config-driven — no code changes needed:

```bash
# Create a strict rule — 5 requests per minute on /api/keys
curl -X POST http://localhost:3000/api/limits \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "route": "/keys",
    "max_requests": 5,
    "window_seconds": 60,
    "strategy": "sliding_window"
  }'
```

Now hit `/api/keys` 6 times — `429` on the 6th. Delete the rule:

```bash
curl -X DELETE http://localhost:3000/api/limits/RULE_ID \
  -H "x-api-key: YOUR_API_KEY"
```

Hit it again — back to 100 requests per minute. Live config, zero downtime.

---

## Summary

| Feature                            | Status |
| ---------------------------------- | ------ |
| Rate limiting — sliding window     | ✅     |
| Rate limiting — token bucket       | ✅     |
| Rate limiting — fixed window       | ✅     |
| Per IP / key / route / user limits | ✅     |
| Abuse detection — 5 rules          | ✅     |
| Automatic blocking with TTL        | ✅     |
| Manual block / unblock             | ✅     |
| Webhook alerts                     | ✅     |
| Request logging                    | ✅     |
| Metrics endpoint                   | ✅     |
| Admin dashboard                    | ✅     |
| Fully Dockerized                   | ✅     |
| Dynamic config via API             | ✅     |
