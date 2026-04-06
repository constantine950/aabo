import { db } from "../config/database";

export interface RateLimitConfig {
  id: string;
  api_key_id: string | null;
  user_id: string | null;
  ip: string | null;
  route: string | null;
  max_requests: number;
  window_seconds: number;
  strategy: "sliding_window" | "fixed_window" | "token_bucket";
}

export const RateLimitModel = {
  // Find the most specific config that matches the request context.
  // Priority: route+key > route > key > user > ip > global (null on all)
  findForRequest: async (params: {
    api_key_id?: string;
    user_id?: string;
    ip?: string;
    route?: string;
  }): Promise<RateLimitConfig | null> => {
    const { api_key_id, user_id, ip, route } = params;

    const result = await db.query<RateLimitConfig>(
      `SELECT * FROM rate_limits
       WHERE (api_key_id = $1 OR api_key_id IS NULL)
         AND (user_id    = $2 OR user_id    IS NULL)
         AND (ip         = $3 OR ip         IS NULL)
         AND (route      = $4 OR route      IS NULL)
       ORDER BY
         (api_key_id IS NOT NULL)::int +
         (user_id    IS NOT NULL)::int +
         (ip         IS NOT NULL)::int +
         (route      IS NOT NULL)::int DESC
       LIMIT 1`,
      [api_key_id ?? null, user_id ?? null, ip ?? null, route ?? null],
    );

    return result.rows[0] ?? null;
  },

  create: async (
    config: Omit<RateLimitConfig, "id">,
  ): Promise<RateLimitConfig> => {
    const result = await db.query<RateLimitConfig>(
      `INSERT INTO rate_limits
        (api_key_id, user_id, ip, route, max_requests, window_seconds, strategy)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        config.api_key_id,
        config.user_id,
        config.ip,
        config.route,
        config.max_requests,
        config.window_seconds,
        config.strategy,
      ],
    );
    return result.rows[0];
  },

  list: async (): Promise<RateLimitConfig[]> => {
    const result = await db.query<RateLimitConfig>(
      `SELECT * FROM rate_limits ORDER BY created_at DESC`,
    );
    return result.rows;
  },

  delete: async (id: string): Promise<boolean> => {
    const result = await db.query(`DELETE FROM rate_limits WHERE id = $1`, [
      id,
    ]);
    return (result.rowCount ?? 0) > 0;
  },
};
