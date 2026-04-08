import { redis } from "../config/redis";

//Generic helpers
export const get = async (key: string): Promise<string | null> => {
  return redis.get(key);
};

export const set = async (
  key: string,
  value: string,
  ttlSeconds?: number,
): Promise<void> => {
  if (ttlSeconds) {
    await redis.set(key, value, { EX: ttlSeconds });
  } else {
    await redis.set(key, value);
  }
};

export const del = async (key: string): Promise<void> => {
  await redis.del(key);
};

export const exists = async (key: string): Promise<boolean> => {
  return (await redis.exists(key)) === 1;
};

//Fixed window
export const fwIncr = async (
  key: string,
  ttlSeconds: number,
): Promise<number> => {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, ttlSeconds);
  }
  return count;
};

//Sliding window

export const swAdd = async (
  key: string,
  score: number,
  member: string,
  ttlSeconds: number,
): Promise<void> => {
  await redis.zAdd(key, { score, value: member });
  await redis.expire(key, ttlSeconds);
};

export const swEvict = async (
  key: string,
  windowStart: number,
): Promise<void> => {
  await redis.zRemRangeByScore(key, "-inf", windowStart);
};

export const swCount = async (key: string): Promise<number> => {
  return redis.zCard(key);
};

export const swOldest = async (key: string): Promise<number | null> => {
  const oldest = await redis.zRange(key, 0, 0, { BY: "SCORE" });
  if (!oldest.length) return null;
  return redis.zScore(key, oldest[0]);
};

//Token bucket
export const tbGet = async (
  key: string,
): Promise<{ tokens: number; lastRefill: number } | null> => {
  const data = await redis.hGetAll(key);
  if (!data.tokens) return null;
  return {
    tokens: parseFloat(data.tokens),
    lastRefill: parseInt(data.lastRefill),
  };
};

export const tbSet = async (
  key: string,
  tokens: number,
  lastRefill: number,
  ttlSeconds: number,
): Promise<void> => {
  await redis.hSet(key, {
    tokens: tokens.toString(),
    lastRefill: lastRefill.toString(),
  });
  await redis.expire(key, ttlSeconds);
};

//Block helpers
export const block = async (
  type: string,
  value: string,
  reason: string,
  ttlSeconds: number,
): Promise<void> => {
  await redis.set(`block:${type}:${value}`, reason, { EX: ttlSeconds });
};

export const isBlocked = async (
  type: string,
  value: string,
): Promise<string | null> => {
  return redis.get(`block:${type}:${value}`);
};

export const unblock = async (type: string, value: string): Promise<void> => {
  await redis.del(`block:${type}:${value}`);
};

//Memory info
export const memoryUsage = async (): Promise<string> => {
  const info = await redis.info("memory");
  const match = info.match(/used_memory_human:(\S+)/);
  return match ? match[1] : "unknown";
};
