# Architecture

## Overview

Ààbò runs as Express middleware inside your existing Node.js application.
Every request passes through a pipeline of middleware before reaching your
route handlers. If a request is rate-limited or flagged as abusive, it is
rejected early — your route handler never executes.

```
Client → Ààbò (Express middleware) → Your API routes
              |               |
           Redis          Postgres
        (counters,       (logs, keys,
        TTL blocks)        config)
```

---

## Middleware pipeline

Requests flow left to right through each layer in order:

```
Request → Auth → Logger → Limiter → Detector → Route → Response
```

| Layer    | File                          | Responsibility                                      |
| -------- | ----------------------------- | --------------------------------------------------- |
| Auth     | `middleware/auth.ts`          | Validate API key, attach identity to `req`          |
| Logger   | `middleware/logger.ts`        | Record IP, route, timestamp to Postgres             |
| Limiter  | `middleware/rateLimiter.ts`   | Check Redis counters, return 429 if over limit      |
| Detector | `middleware/abuseDetector.ts` | Check block list, run abuse rules, block if flagged |
| Route    | `routes/`                     | Handle the actual request                           |

Order matters. Auth runs first so every downstream layer knows who the
caller is. Logger runs before limiting so even rejected requests are recorded.

---

## Data stores

### Redis

Used for anything that needs sub-millisecond reads and automatic expiry.

- Sliding window sorted sets (`sw:{key}`)
- Token bucket state (`tb:{key}`)
- Fixed window counters (`fw:{key}:{bucket}`)
- Active blocks (`block:{type}:{value}`)

### Postgres

Used for durable storage that needs to be queried or reported on.

- `api_keys` — registered keys and their active status
- `rate_limits` — per-key or per-route limit configuration
- `request_logs` — every request with IP, route, status, blocked flag
- `blocked_entities` — audit log of blocks with reason and expiry

---

## Key design decisions

**Why middleware, not a standalone proxy?**
Middleware integrates directly into the developer's Express app with zero
infrastructure overhead. No extra Docker container, no network hop, no proxy
configuration. The tradeoff is that it only protects a single Express app —
a proxy would protect any upstream service regardless of language or framework.

**Why Redis for counters and not Postgres?**
Rate limiting requires reading and writing on every single request. Postgres
can handle this but adds ~5–10ms per operation. Redis operates at <1ms and
has native TTL support — keys expire automatically with no cleanup job needed.

**Why sliding window as the primary algorithm?**
Fixed windows allow a burst of 2× the limit at the window boundary (e.g. 100
requests at 11:59 and 100 more at 12:00 are both within separate windows).
Sliding window tracks exact timestamps so the limit is always enforced over
the true last N seconds, regardless of when the window starts.

---

## Folder map

```
src/
├── config/         Redis and Postgres client setup
├── middleware/     Express middleware (auth, logger, limiter, detector)
├── limiters/       Pure rate limiting logic (no Express dependency)
├── detection/      Abuse rules, engine, blocker, alerts
├── routes/         API endpoint handlers
├── models/         Postgres query helpers per table
├── services/       Shared utilities (Redis ops, key gen, metrics)
├── types/          Shared TypeScript interfaces
├── app.ts          Express app setup and middleware registration
└── server.ts       Entry point — binds to port
```
