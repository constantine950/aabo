import { db } from "../config/database";

export interface RequestLogEntry {
  ip: string | null;
  user_id?: string | null;
  api_key_id?: string | null;
  route: string;
  method: string;
  status_code: number;
  blocked: boolean;
  block_reason?: string | null;
  response_ms: number;
}

export const RequestLogModel = {
  create: async (entry: RequestLogEntry): Promise<void> => {
    await db.query(
      `INSERT INTO request_logs
        (ip, user_id, api_key_id, route, method, status_code, blocked, block_reason, response_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        entry.ip,
        entry.user_id ?? null,
        entry.api_key_id ?? null,
        entry.route,
        entry.method,
        entry.status_code,
        entry.blocked,
        entry.block_reason ?? null,
        entry.response_ms,
      ],
    );
  },

  list: async (
    filters: {
      ip?: string;
      api_key_id?: string;
      route?: string;
      blocked?: boolean;
      limit?: number;
    } = {},
  ): Promise<RequestLogEntry[]> => {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (filters.ip) {
      conditions.push(`ip = $${i++}`);
      values.push(filters.ip);
    }
    if (filters.api_key_id) {
      conditions.push(`api_key_id = $${i++}`);
      values.push(filters.api_key_id);
    }
    if (filters.route) {
      conditions.push(`route = $${i++}`);
      values.push(filters.route);
    }
    if (filters.blocked !== undefined) {
      conditions.push(`blocked = $${i++}`);
      values.push(filters.blocked);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = filters.limit ?? 100;

    const result = await db.query(
      `SELECT * FROM request_logs ${where} ORDER BY created_at DESC LIMIT ${limit}`,
      values,
    );
    return result.rows;
  },
};
