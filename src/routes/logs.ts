import { Router, Request, Response, NextFunction } from "express";
import { RequestLogModel } from "../models/RequestLog";

const router = Router();

// GET /api/logs
router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ip, api_key_id, route, blocked, limit } = req.query as {
        ip?: string;
        api_key_id?: string;
        route?: string;
        blocked?: string;
        limit?: string;
      };

      const logs = await RequestLogModel.list({
        ip,
        api_key_id,
        route,
        blocked: blocked !== undefined ? blocked === "true" : undefined,
        limit: limit ? parseInt(limit) : 100,
      });

      res.json(logs);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
