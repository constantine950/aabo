import { redis } from "../config/redis";
import { LimiterOptions, LimiterResult } from "./fixedWindow";

export const slidingWindow = async ({
  key,
  maxRequests,
  windowSeconds,
}: LimiterOptions): Promise<LimiterResult> => {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = now - windowMs;
  const redisKey = `sw:${key}`;

  // Remove entries outside the current window
  await redis.zRemRangeByScore(redisKey, "-inf", windowStart);

  // Count remaining entries in window
  const count = await redis.zCard(redisKey);

  if (count >= maxRequests) {
    // Get the oldest entry to calculate reset time
    const oldest = await redis.zRange(redisKey, 0, 0, { BY: "SCORE" });
    const oldestScore = oldest.length
      ? await redis.zScore(redisKey, oldest[0])
      : now;
    const resetInSeconds = Math.ceil(
      ((oldestScore ?? now) + windowMs - now) / 1000,
    );

    return {
      allowed: false,
      count,
      limit: maxRequests,
      remaining: 0,
      resetInSeconds: Math.max(1, resetInSeconds),
    };
  }

  // Add current request as a scored entry
  await redis.zAdd(redisKey, {
    score: now,
    value: `${now}-${Math.random().toString(36).slice(2)}`,
  });

  // Keep the key alive for the duration of the window
  await redis.expire(redisKey, windowSeconds);

  return {
    allowed: true,
    count: count + 1,
    limit: maxRequests,
    remaining: maxRequests - (count + 1),
    resetInSeconds: windowSeconds,
  };
};
