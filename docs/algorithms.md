# Algorithms

## Overview

Ààbò implements three rate limiting algorithms. Each has different tradeoffs
between accuracy, burst tolerance, and Redis overhead. The algorithm is
configurable per API key, route, IP, or user via the `rate_limits` table.

---

## 1. Fixed Window

### How it works

Divides time into fixed buckets (e.g. one per minute). Counts requests per
bucket. Resets to zero at the start of each new bucket.

### Redis operations

```
INCR  fw:{key}:{bucket}
EXPIRE fw:{key}:{bucket} {windowSeconds}
```

### Tradeoffs

|     |                                          |
| --- | ---------------------------------------- |
| ✅  | Simplest implementation                  |
| ✅  | Lowest Redis overhead (2 ops)            |
| ❌  | Burst vulnerability at window boundaries |

### Boundary burst problem

A client can send `maxRequests` at 11:59:59 and another `maxRequests` at
12:00:00 — both within their respective windows but 2× the intended limit
within a single second.

### When to use

Low-stakes endpoints where simplicity matters more than precision. Good for
background jobs or internal tooling.

---

## 2. Sliding Window

### How it works

Tracks the exact timestamp of every request in a Redis sorted set. On each
request, evicts entries older than `now - windowSeconds`, counts what remains,
then adds the current timestamp. The window always covers the true last N
seconds regardless of clock boundaries.

### Redis operations

```
ZREMRANGEBYSCORE sw:{key} -inf {windowStart}   — evict old entries
ZCARD sw:{key}                                  — count in window
ZADD  sw:{key} {now} {member}                   — record this request
EXPIRE sw:{key} {windowSeconds}                 — keep key alive
```

### Tradeoffs

|     |                                                      |
| --- | ---------------------------------------------------- |
| ✅  | Most accurate — no boundary burst problem            |
| ✅  | `Retry-After` calculated from oldest entry (precise) |
| ❌  | Higher Redis memory — one entry per request          |
| ❌  | 3–4 Redis ops per request vs 2 for fixed window      |

### When to use

Primary algorithm for most endpoints. Accurate and fair — the right default
for any API that needs reliable rate limiting.

---

## 3. Token Bucket

### How it works

Each client has a bucket that holds up to `capacity` tokens. Tokens refill at
`refillRate` per second up to the capacity ceiling. Each request consumes one
token. If the bucket is empty the request is rejected.

State is stored as two fields in a Redis hash: `tokens` (float) and
`lastRefill` (timestamp ms). Refill is calculated on-demand at request time —
no background timer needed.

### Redis operations

```
HGETALL tb:{key}            — read current state
HSET    tb:{key} ...        — write updated state
EXPIRE  tb:{key} {ttl}      — keep key alive
```

### Tradeoffs

|     |                                                         |
| --- | ------------------------------------------------------- |
| ✅  | Allows legitimate bursts up to `capacity`               |
| ✅  | Smooths out bursty but well-behaved clients             |
| ✅  | Only 2 fields in Redis regardless of request volume     |
| ❌  | Less intuitive to reason about than window-based limits |
| ❌  | Float arithmetic means limits aren't perfectly sharp    |

### When to use

Endpoints where short bursts are expected and acceptable — e.g. a client
uploading a batch of files, or a webhook receiver handling a spike.

---

## Comparison

| Algorithm      | Accuracy | Burst handling | Redis ops | Memory      |
| -------------- | -------- | -------------- | --------- | ----------- |
| Fixed window   | Low      | Poor           | 2         | Minimal     |
| Sliding window | High     | Moderate       | 3–4       | Per-request |
| Token bucket   | High     | Excellent      | 3         | Constant    |

---

## Abuse detection

Beyond rate limiting, Ààbò runs a rule-based detection engine on every
request. Rules track counters and distinct-value sets in Redis:

| Rule                     | Tracks               | Threshold  | Block duration |
| ------------------------ | -------------------- | ---------- | -------------- |
| `too_many_requests`      | Request volume       | 200 / 60s  | 5 min          |
| `repeated_auth_failures` | Auth failures        | 10 / 5 min | 10 min         |
| `suspicious_route_scan`  | Distinct routes      | 30 / 60s   | 5 min          |
| `high_error_rate`        | 4xx/5xx responses    | 50 / 60s   | 3 min          |
| `rapid_ip_rotation`      | Distinct IPs per key | 10 / 5 min | 10 min         |

Rules are evaluated in order — first match wins. Blocks are written to Redis
(TTL-based, auto-expire) and Postgres (permanent audit trail).
