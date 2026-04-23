import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { slidingWindow, fixedWindow, tokenBucket } from "../limiters";
import { RateLimitModel, RateLimitConfig } from "../models/RateLimit";
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

// In-memory cache for DB config lookups
// TTL: 60s — avoids a Postgres query on every single request
const configCache = new Map<
  string,
  { config: RateLimitConfig | null; expiresAt: number }
>();
const CACHE_TTL_MS = 60_000;

const getCachedConfig = async (params: {
  api_key_id?: string;
  ip?: string;
  route?: string;
}): Promise<RateLimitConfig | null> => {
  const cacheKey = `${params.api_key_id ?? ""}:${params.ip ?? ""}:${params.route ?? ""}`;
  const cached = configCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.config;
  }

  const config = await RateLimitModel.findForRequest(params);
  configCache.set(cacheKey, { config, expiresAt: Date.now() + CACHE_TTL_MS });
  return config;
};

const setHeaders = (res: Response, result: LimiterResult): void => {
  res.set("X-RateLimit-Limit", String(result.limit));
  res.set("X-RateLimit-Remaining", String(result.remaining));
  res.set("X-RateLimit-Reset", String(result.resetInSeconds));
};

const buildKey = (req: AuthenticatedRequest): string => {
  const keyId = req.apiKey?.id ?? "anon";
  const ip = req.ip ?? "unknown";
  return `${req.path}:${keyId}:${ip}`;
};

export const rateLimiter = (fallback: RateLimiterOptions = {}) => {
  const defaults = { ...DEFAULT, ...fallback };

  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dbConfig = await getCachedConfig({
        api_key_id: req.apiKey?.id,
        ip: req.ip ?? undefined,
        route: req.path,
      });

      const strategy = dbConfig?.strategy ?? defaults.strategy;
      const maxReqs = dbConfig?.max_requests ?? defaults.maxRequests;
      const windowSec = dbConfig?.window_seconds ?? defaults.windowSeconds;

      const key = buildKey(req);
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
      console.error("[rateLimiter] error, failing open:", err);
      next();
    }
  };
};
