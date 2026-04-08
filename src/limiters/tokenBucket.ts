import { tbGet, tbSet } from "../services/redisService";
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
  const ttl = Math.ceil(capacity / refillRate) + 60;

  const stored = await tbGet(redisKey);

  const lastRefill = stored?.lastRefill ?? now;
  const elapsed = (now - lastRefill) / 1000;
  let tokens = Math.min(
    capacity,
    (stored?.tokens ?? capacity) + elapsed * refillRate,
  );

  const resetInSeconds = tokens < 1 ? Math.ceil((1 - tokens) / refillRate) : 0;

  if (tokens < 1) {
    await tbSet(redisKey, tokens, now, ttl);
    return {
      allowed: false,
      count: Math.floor(capacity - tokens),
      limit: capacity,
      remaining: 0,
      resetInSeconds,
    };
  }

  tokens -= 1;
  await tbSet(redisKey, tokens, now, ttl);

  return {
    allowed: true,
    count: Math.floor(capacity - tokens),
    limit: capacity,
    remaining: Math.floor(tokens),
    resetInSeconds: 0,
  };
};
