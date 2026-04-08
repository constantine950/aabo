import { Router, Request, Response, NextFunction } from "express";
import { RateLimitModel } from "../models/RateLimit";

const router = Router();

// GET /api/limits — list all rate limit rules
router.get(
  "/",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limits = await RateLimitModel.list();
      res.json(limits);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/limits — create a new rule
router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        api_key_id,
        user_id,
        ip,
        route,
        max_requests,
        window_seconds,
        strategy,
      } = req.body as {
        api_key_id?: string;
        user_id?: string;
        ip?: string;
        route?: string;
        max_requests?: number;
        window_seconds?: number;
        strategy?: "sliding_window" | "fixed_window" | "token_bucket";
      };

      if (!max_requests || !window_seconds) {
        res
          .status(400)
          .json({ error: "max_requests and window_seconds are required" });
        return;
      }

      const limit = await RateLimitModel.create({
        api_key_id: api_key_id ?? null,
        user_id: user_id ?? null,
        ip: ip ?? null,
        route: route ?? null,
        max_requests,
        window_seconds,
        strategy: strategy ?? "sliding_window",
      });

      res.status(201).json(limit);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/limits/:id — remove a rule
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await RateLimitModel.delete(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Rate limit rule not found" });
        return;
      }
      res.json({ deleted: true });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
