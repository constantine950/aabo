import { redis } from "../config/redis";

// Generic helpers

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

// Fixed window

export const fwIncr = async (
  key: string,
  ttlSeconds: number,
): Promise<number> => {
  // Pipeline INCR + EXPIRE into a single round trip
  const pipeline = redis.multi();
  pipeline.incr(key);
  pipeline.expire(key, ttlSeconds);
  const results = await pipeline.exec();
  return results[0] as number;
};

// Sliding window

export const swAdd = async (
  key: string,
  score: number,
  member: string,
  ttlSeconds: number,
): Promise<void> => {
  const pipeline = redis.multi();
  pipeline.zAdd(key, { score, value: member });
  pipeline.expire(key, ttlSeconds);
  await pipeline.exec();
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

// Token bucket

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
  const pipeline = redis.multi();
  pipeline.hSet(key, {
    tokens: tokens.toString(),
    lastRefill: lastRefill.toString(),
  });
  pipeline.expire(key, ttlSeconds);
  await pipeline.exec();
};

// Block helpers

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

// Block check pipeline — single round trip for IP + key

export const checkBothBlocked = async (
  ip: string,
  apiKeyId?: string,
): Promise<{ ipBlock: string | null; keyBlock: string | null }> => {
  const pipeline = redis.multi();
  pipeline.get(`block:ip:${ip}`);
  if (apiKeyId) pipeline.get(`block:key:${apiKeyId}`);
  const results = await pipeline.exec();

  return {
    ipBlock: results[0] as string | null,
    keyBlock: apiKeyId ? (results[1] as string | null) : null,
  };
};

//Memory info

export const memoryUsage = async (): Promise<string> => {
  const info = await redis.info("memory");
  const match = info.match(/used_memory_human:(\S+)/);
  return match ? match[1] : "unknown";
};
