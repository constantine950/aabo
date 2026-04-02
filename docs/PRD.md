# Ààbò — Product Requirements Document

## Overview

Ààbò is a rate-limiting and abuse detection API that protects backend services
from excessive or malicious traffic using intelligent request control.

It sits between incoming clients and your target API, inspecting every request
and deciding — in milliseconds — whether to allow, throttle, or block it.

---

## Problem

Unprotected APIs are vulnerable to:

- Accidental overload from misbehaving clients
- Deliberate abuse (credential stuffing, scraping, DDoS)
- Runaway scripts that hammer endpoints without back-off
- Uneven traffic that starves legitimate users

Most teams bolt on basic rate limiting too late, with no visibility into what
is actually being blocked or why.

---

## Goals

1. Provide accurate, configurable rate limiting per IP, per API key, and per route
2. Detect and block abusive traffic patterns automatically
3. Give operators full visibility via logs and metrics
4. Be easy to integrate — drop-in middleware for any Node.js/Express service

---

## Non-Goals (v1)

- Not a full API gateway (no routing, auth delegation, or load balancing)
- No GraphQL-specific support
- No multi-region Redis clustering
- Dashboard is a stretch goal — CLI and API endpoints are the primary interface

---

## Users

| User                       | Description                                                      |
| -------------------------- | ---------------------------------------------------------------- |
| **Developer**              | Integrates Ààbò as Express middleware to protect their API       |
| **Platform / DevOps team** | Deploys Ààbò as a standalone proxy in front of existing services |

Both users need the same core features; they differ only in how they integrate.

---

## Core Features

### 1. Rate Limiting

Limit the number of requests a client can make within a time window.

| Dimension   | Description                                           |
| ----------- | ----------------------------------------------------- |
| Per IP      | Limit requests from a single IP address               |
| Per API key | Limit requests tied to a specific API key             |
| Per route   | Apply different limits to different endpoints         |
| Per user    | Limit requests tied to an authenticated user identity |

**Algorithms (in priority order):**

- Sliding window — primary algorithm, accurate and fair
- Token bucket — secondary, for burst-tolerant endpoints
- Fixed window — simple fallback, lower Redis overhead

### 2. Abuse Detection

Automatically flag and block clients showing suspicious patterns:

- Too many requests in a short burst
- Repeated authentication failures
- Scanning across many routes in quick succession

### 3. Block / Allow System

- Block an IP or API key manually or automatically
- Blocks are time-limited (TTL) and auto-expire
- Manual unblock via API endpoint

### 4. Request Logging

Every request is logged with:

- IP address
- API key (if present)
- Route
- Timestamp
- Status code
- Whether it was blocked

### 5. Metrics Endpoints

Expose real-time counters:

- Requests per second
- Total blocked requests
- Block rate (blocked / total)
- Per-route traffic breakdown

---

## Stretch Goal — Admin Dashboard

A React + Vite UI for operators to:

- View and manage API keys
- Browse and filter request logs
- See live traffic and abuse charts
- Manually block / unblock entities

---
