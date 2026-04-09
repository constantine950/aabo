import { db } from "../config/database";

export interface BlockedEntity {
  id: string;
  entity_type: "ip" | "key" | "user";
  entity_value: string;
  reason: string | null;
  blocked_by: "system" | "manual";
  expires_at: Date | null;
  created_at: Date;
}

export const BlockedEntityModel = {
  upsert: async (
    data: Omit<BlockedEntity, "id" | "created_at">,
  ): Promise<BlockedEntity> => {
    const result = await db.query<BlockedEntity>(
      `INSERT INTO blocked_entities
        (entity_type, entity_value, reason, blocked_by, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (entity_type, entity_value)
       DO UPDATE SET
         reason     = EXCLUDED.reason,
         blocked_by = EXCLUDED.blocked_by,
         expires_at = EXCLUDED.expires_at
       RETURNING *`,
      [
        data.entity_type,
        data.entity_value,
        data.reason,
        data.blocked_by,
        data.expires_at,
      ],
    );
    return result.rows[0];
  },

  list: async (): Promise<BlockedEntity[]> => {
    const result = await db.query<BlockedEntity>(
      `SELECT * FROM blocked_entities
       WHERE expires_at > NOW() OR expires_at IS NULL
       ORDER BY created_at DESC`,
    );
    return result.rows;
  },

  remove: async (type: string, value: string): Promise<boolean> => {
    const result = await db.query(
      `DELETE FROM blocked_entities
       WHERE entity_type = $1 AND entity_value = $2`,
      [type, value],
    );
    return (result.rowCount ?? 0) > 0;
  },
};
