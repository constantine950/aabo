import { redis } from "../config/redis";

// Increment a short-lived counter in Redis for abuse detection tracking.
// Each metric key is scoped to an entity (IP or API key) and a window.

export const increment = async (
  entity: string,
  metric: string,
  windowSeconds: number,
): Promise<number> => {
  const key = `metric:${metric}:${entity}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  return count;
};

export const getCount = async (
  entity: string,
  metric: string,
): Promise<number> => {
  const key = `metric:${metric}:${entity}`;
  const val = await redis.get(key);
  return val ? parseInt(val) : 0;
};

// Count distinct values for a given entity within a window.
// Used for route scan detection (how many unique routes hit) and
// rapid IP rotation (how many unique IPs used the same key).
export const trackDistinct = async (
  entity: string,
  metric: string,
  value: string,
  windowSeconds: number,
): Promise<number> => {
  const key = `distinct:${metric}:${entity}`;
  await redis.sAdd(key, value);
  await redis.expire(key, windowSeconds);
  return redis.sCard(key);
};
