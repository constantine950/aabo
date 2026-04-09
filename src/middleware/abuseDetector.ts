import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { detect } from "../detection/engine";
import { checkBlocked, blockEntity } from "../detection/blocker";

export const abuseDetector = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const ip = req.ip ?? "unknown";
  const apiKeyId = req.apiKey?.id;

  try {
    // 1. Check if IP is already blocked
    const ipBlock = await checkBlocked("ip", ip);
    if (ipBlock) {
      res.status(403).json({ error: "Blocked", reason: ipBlock });
      return;
    }

    // 2. Check if API key is already blocked
    if (apiKeyId) {
      const keyBlock = await checkBlocked("key", apiKeyId);
      if (keyBlock) {
        res.status(403).json({ error: "Blocked", reason: keyBlock });
        return;
      }
    }

    // 3. Run detection engine on current request
    const result = await detect({
      ip,
      apiKeyId,
      route: req.path,
      statusCode: res.statusCode,
      isAuthFailure: false,
    });

    if (result.flagged && result.rule) {
      // Block both the IP and the API key if present
      await blockEntity("ip", ip, result.rule);
      if (apiKeyId) {
        await blockEntity("key", apiKeyId, result.rule);
      }

      res.status(403).json({
        error: "Blocked due to suspicious activity",
        reason: result.reason,
      });
      return;
    }

    next();
  } catch (err) {
    // Fail open — detection errors should never block legitimate traffic
    console.error("[abuseDetector] error, failing open:", err);
    next();
  }
};
