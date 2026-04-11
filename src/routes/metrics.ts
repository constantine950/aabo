import { Router, Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { memoryUsage } from "../services/redisService";

const router = Router();

// GET /api/metrics
router.get(
  "/",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [
        totalResult,
        blockedResult,
        recentResult,
        routesResult,
        redisMemory,
      ] = await Promise.all([
        // Total requests
        db.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM request_logs`,
        ),
        // Total blocked
        db.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM request_logs WHERE blocked = true`,
        ),
        // Requests in last 60 seconds
        db.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM request_logs
         WHERE created_at > NOW() - INTERVAL '60 seconds'`,
        ),
        // Top 5 routes by request count
        db.query<{ route: string; count: string; blocked: string }>(
          `SELECT
           route,
           COUNT(*) as count,
           COUNT(*) FILTER (WHERE blocked = true) as blocked
         FROM request_logs
         GROUP BY route
         ORDER BY count DESC
         LIMIT 5`,
        ),
        // Redis memory usage
        memoryUsage(),
      ]);

      const total = parseInt(totalResult.rows[0].count);
      const blocked = parseInt(blockedResult.rows[0].count);
      const recent = parseInt(recentResult.rows[0].count);

      res.json({
        total_requests: total,
        blocked_requests: blocked,
        success_rate:
          total > 0 ? +((1 - blocked / total) * 100).toFixed(2) : 100,
        requests_per_min: recent,
        top_routes: routesResult.rows.map((r) => ({
          route: r.route,
          count: parseInt(r.count),
          blocked: parseInt(r.blocked),
        })),
        redis_memory: redisMemory,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
