-- Ààbò — database schema

-- api_keys
-- Stores registered API keys. The raw key is never saved —
-- only a SHA-256 hash. The name is a human-readable label.

CREATE TABLE IF NOT EXISTS api_keys (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash     VARCHAR(64) UNIQUE NOT NULL,
  name         VARCHAR(100),
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- rate_limits
-- Config-driven limits. Any combination of scopes can be set.
-- NULL on a scope column means "applies to all" for that dimension.
-- Strategy controls which algorithm is used for this rule.

CREATE TABLE IF NOT EXISTS rate_limits (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id     UUID        REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id        VARCHAR(255),
  ip             VARCHAR(45),
  route          VARCHAR(255),
  max_requests   INT         NOT NULL DEFAULT 100,
  window_seconds INT         NOT NULL DEFAULT 60,
  strategy       VARCHAR(20) NOT NULL DEFAULT 'sliding_window'
                             CHECK (strategy IN ('sliding_window', 'token_bucket', 'fixed_window')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- request_logs
-- Append-only log of every request Ààbò processes.
-- blocked = true means the request was rejected (429 or 403).

CREATE TABLE IF NOT EXISTS request_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip           VARCHAR(45),
  user_id      VARCHAR(255),
  api_key_id   UUID        REFERENCES api_keys(id) ON DELETE SET NULL,
  route        VARCHAR(255),
  method       VARCHAR(10),
  status_code  INT,
  blocked      BOOLEAN     NOT NULL DEFAULT false,
  block_reason VARCHAR(100),
  response_ms  INT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- blocked_entities
-- Persistent record of blocks. Redis holds the live TTL block;
-- this table holds the audit trail and survives Redis flushes.
-- entity_type is 'ip', 'key', or 'user'.
-- expires_at NULL means the block is permanent until manually lifted.

CREATE TABLE IF NOT EXISTS blocked_entities (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   VARCHAR(10) NOT NULL CHECK (entity_type IN ('ip', 'key', 'user')),
  entity_value  VARCHAR(255) NOT NULL,
  reason        VARCHAR(255),
  blocked_by    VARCHAR(20) NOT NULL DEFAULT 'system'
                            CHECK (blocked_by IN ('system', 'manual')),
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, entity_value)
);

-- Indexes

-- Logs are queried most often by time, IP, key, and route
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at  ON request_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_ip          ON request_logs (ip);
CREATE INDEX IF NOT EXISTS idx_request_logs_api_key_id  ON request_logs (api_key_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_route       ON request_logs (route);
CREATE INDEX IF NOT EXISTS idx_request_logs_blocked     ON request_logs (blocked) WHERE blocked = true;

-- Block lookups happen on every request
CREATE INDEX IF NOT EXISTS idx_blocked_entities_lookup  ON blocked_entities (entity_type, entity_value);

-- Rate limit config lookups by each scope dimension
CREATE INDEX IF NOT EXISTS idx_rate_limits_api_key_id   ON rate_limits (api_key_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip           ON rate_limits (ip);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id      ON rate_limits (user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_route        ON rate_limits (route);