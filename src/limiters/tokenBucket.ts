import { redis } from "../config/redis";
import { LimiterResult } from "./fixedWindow";

export interface TokenBucketOptions {
  key: string;
  capacity: number;
  refillRate: number;
}

export const tokenBucket = async ({
  key,
  capacity,
  refillRate,
}: TokenBucketOptions): Promise<LimiterResult> => {
  const redisKey = `tb:${key}`;
  const now = Date.now();

  const data = await redis.hGetAll(redisKey);

  const lastRefill = data.lastRefill ? parseInt(data.lastRefill) : now;
  const elapsed = (now - lastRefill) / 1000;

  let tokens = data.tokens ? parseFloat(data.tokens) : capacity;
  tokens = Math.min(capacity, tokens + elapsed * refillRate);

  const resetInSeconds = tokens < 1 ? Math.ceil((1 - tokens) / refillRate) : 0;

  if (tokens < 1) {
    // persist the refilled (but still insufficient) token count
    await redis.hSet(redisKey, {
      tokens: tokens.toString(),
      lastRefill: now.toString(),
    });
    await redis.expire(redisKey, Math.ceil(capacity / refillRate) + 60);

    return {
      allowed: false,
      count: Math.floor(capacity - tokens),
      limit: capacity,
      remaining: 0,
      resetInSeconds,
    };
  }

  tokens -= 1;

  await redis.hSet(redisKey, {
    tokens: tokens.toString(),
    lastRefill: now.toString(),
  });
  await redis.expire(redisKey, Math.ceil(capacity / refillRate) + 60);

  return {
    allowed: true,
    count: Math.floor(capacity - tokens),
    limit: capacity,
    remaining: Math.floor(tokens),
    resetInSeconds: 0,
  };
};
