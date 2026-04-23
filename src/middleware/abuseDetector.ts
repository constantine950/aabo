import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { detect } from "../detection/engine";
import { blockEntity } from "../detection/blocker";
import { checkBothBlocked } from "../services/redisService";

// Routes to skip abuse detection on — internal/health endpoints
const SKIP_ROUTES = new Set(["/health", "/metrics", "/logs"]);

export const abuseDetector = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Skip detection for internal routes
  if (SKIP_ROUTES.has(req.path)) {
    next();
    return;
  }

  const ip = req.ip ?? "unknown";
  const apiKeyId = req.apiKey?.id;

  try {
    // Check IP + key blocks in a single Redis pipeline round trip
    const { ipBlock, keyBlock } = await checkBothBlocked(ip, apiKeyId);

    if (ipBlock) {
      res.status(403).json({ error: "Blocked", reason: ipBlock });
      return;
    }

    if (keyBlock) {
      res.status(403).json({ error: "Blocked", reason: keyBlock });
      return;
    }

    // Run detection engine
    const result = await detect({
      ip,
      apiKeyId,
      route: req.path,
      statusCode: res.statusCode,
      isAuthFailure: false,
    });

    if (result.flagged && result.rule) {
      await blockEntity("ip", ip, result.rule);
      if (apiKeyId) await blockEntity("key", apiKeyId, result.rule);

      res.status(403).json({
        error: "Blocked due to suspicious activity",
        reason: result.reason,
      });
      return;
    }

    next();
  } catch (err) {
    console.error("[abuseDetector] error, failing open:", err);
    next();
  }
};
