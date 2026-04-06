import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { slidingWindow, fixedWindow, tokenBucket } from "../limiters";
import { RateLimitModel } from "../models/RateLimit";
import { LimiterResult } from "../limiters";

export type Strategy = "sliding_window" | "fixed_window" | "token_bucket";

export interface RateLimiterOptions {
  strategy?: Strategy;
  maxRequests?: number;
  windowSeconds?: number;
  capacity?: number;
  refillRate?: number;
}

const DEFAULT: Required<RateLimiterOptions> = {
  strategy: "sliding_window",
  maxRequests: 100,
  windowSeconds: 60,
  capacity: 100,
  refillRate: 10,
};

const setHeaders = (res: Response, result: LimiterResult): void => {
  res.set("X-RateLimit-Limit", String(result.limit));
  res.set("X-RateLimit-Remaining", String(result.remaining));
  res.set("X-RateLimit-Reset", String(result.resetInSeconds));
};

const buildKey = (req: AuthenticatedRequest, scope: string): string => {
  const keyId = req.apiKey?.id ?? "anon";
  const ip = req.ip ?? "unknown";
  return `${scope}:${keyId}:${ip}`;
};

export const rateLimiter = (fallback: RateLimiterOptions = {}) => {
  const defaults = { ...DEFAULT, ...fallback };

  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Look up the most specific config from DB for this request
      const dbConfig = await RateLimitModel.findForRequest({
        api_key_id: req.apiKey?.id,
        ip: req.ip ?? undefined,
        route: req.path,
      });

      const strategy = dbConfig?.strategy ?? defaults.strategy;
      const maxReqs = dbConfig?.max_requests ?? defaults.maxRequests;
      const windowSec = dbConfig?.window_seconds ?? defaults.windowSeconds;

      const key = buildKey(req, req.path);
      let result: LimiterResult;

      if (strategy === "token_bucket") {
        result = await tokenBucket({
          key,
          capacity: maxReqs,
          refillRate: defaults.refillRate,
        });
      } else if (strategy === "fixed_window") {
        result = await fixedWindow({
          key,
          maxRequests: maxReqs,
          windowSeconds: windowSec,
        });
      } else {
        result = await slidingWindow({
          key,
          maxRequests: maxReqs,
          windowSeconds: windowSec,
        });
      }

      setHeaders(res, result);

      if (!result.allowed) {
        res.set("Retry-After", String(result.resetInSeconds));
        res.status(429).json({
          error: "Too many requests",
          retryAfter: result.resetInSeconds,
        });
        return;
      }

      next();
    } catch (err) {
      // Redis failure — fail open
      console.error("[rateLimiter] error, failing open:", err);
      next();
    }
  };
};
