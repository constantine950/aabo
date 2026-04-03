import { db } from "../config/database";
import { ApiKey } from "../types";

export const ApiKeyModel = {
  create: async (keyHash: string, name?: string): Promise<ApiKey> => {
    const result = await db.query<ApiKey>(
      `INSERT INTO api_keys (key_hash, name)
       VALUES ($1, $2)
       RETURNING *`,
      [keyHash, name ?? null],
    );
    return result.rows[0];
  },

  findByHash: async (keyHash: string): Promise<ApiKey | null> => {
    const result = await db.query<ApiKey>(
      `SELECT * FROM api_keys
       WHERE key_hash = $1 AND is_active = true`,
      [keyHash],
    );
    return result.rows[0] ?? null;
  },

  list: async (): Promise<Omit<ApiKey, "key_hash">[]> => {
    const result = await db.query<Omit<ApiKey, "key_hash">>(
      `SELECT id, name, is_active, created_at, updated_at
       FROM api_keys
       ORDER BY created_at DESC`,
    );
    return result.rows;
  },

  revoke: async (id: string): Promise<boolean> => {
    const result = await db.query(
      `UPDATE api_keys SET is_active = false, updated_at = NOW()
       WHERE id = $1`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  },
};
