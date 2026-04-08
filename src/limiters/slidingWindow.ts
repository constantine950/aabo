import { swAdd, swEvict, swCount, swOldest } from "../services/redisService";
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

  await swEvict(redisKey, windowStart);
  const count = await swCount(redisKey);

  if (count >= maxRequests) {
    const oldestScore = await swOldest(redisKey);
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

  const member = `${now}-${Math.random().toString(36).slice(2)}`;
  await swAdd(redisKey, now, member, windowSeconds);

  return {
    allowed: true,
    count: count + 1,
    limit: maxRequests,
    remaining: maxRequests - (count + 1),
    resetInSeconds: windowSeconds,
  };
};
