import { Router, Request, Response, NextFunction } from "express";
import { ApiKeyModel } from "../models/ApiKey";
import { generateKey, hashKey } from "../services/keyService";

const router = Router();

// POST /api/keys — generate a new API key
router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.body as { name?: string };
      const raw = generateKey();
      const hash = hashKey(raw);
      const apiKey = await ApiKeyModel.create(hash, name);

      res.status(201).json({
        id: apiKey.id,
        name: apiKey.name,
        key: raw,
        created_at: apiKey.created_at,
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/keys — list all keys (hash never returned)
router.get(
  "/",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const keys = await ApiKeyModel.list();
      res.json(keys);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/keys/:id — revoke a key
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const revoked = await ApiKeyModel.revoke(req.params.id);
      if (!revoked) {
        res.status(404).json({ error: "API key not found" });
        return;
      }
      res.json({ revoked: true });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
