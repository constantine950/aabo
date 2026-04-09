import { Router, Request, Response, NextFunction } from "express";
import { BlockedEntityModel } from "../models/BlockedEntity";
import { blockEntity, unblockEntity } from "../detection/blocker";
import { EntityType } from "../detection/blocker";

const router = Router();

// GET /api/blocks — list all active blocks
router.get(
  "/",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const blocks = await BlockedEntityModel.list();
      res.json(blocks);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/blocks — manually block an entity
router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { entity_type, entity_value, reason } = req.body as {
        entity_type?: EntityType;
        entity_value?: string;
        reason?: string;
      };

      if (!entity_type || !entity_value) {
        res
          .status(400)
          .json({ error: "entity_type and entity_value are required" });
        return;
      }

      if (!["ip", "key", "user"].includes(entity_type)) {
        res.status(400).json({ error: "entity_type must be ip, key, or user" });
        return;
      }

      await BlockedEntityModel.upsert({
        entity_type,
        entity_value,
        reason: reason ?? "Manually blocked",
        blocked_by: "manual",
        expires_at: null,
      });

      // Also write to Redis with a 24h TTL for manual blocks
      const { block } = await import("../services/redisService");
      await block(
        entity_type,
        entity_value,
        reason ?? "Manually blocked",
        86400,
      );

      res.status(201).json({ blocked: true });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/blocks/:type/:value — unblock an entity
router.delete(
  "/:type/:value",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type, value } = req.params;

      if (!["ip", "key", "user"].includes(type)) {
        res.status(400).json({ error: "type must be ip, key, or user" });
        return;
      }

      await unblockEntity(type as EntityType, value);
      res.json({ unblocked: true });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
