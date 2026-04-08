import { fwIncr } from "../services/redisService";

export interface LimiterOptions {
  key: string;
  maxRequests: number;
  windowSeconds: number;
}

export interface LimiterResult {
  allowed: boolean;
  count: number;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

export const fixedWindow = async ({
  key,
  maxRequests,
  windowSeconds,
}: LimiterOptions): Promise<LimiterResult> => {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const redisKey = `fw:${key}:${bucket}`;

  const count = await fwIncr(redisKey, windowSeconds);

  const resetInSeconds =
    windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds);

  return {
    allowed: count <= maxRequests,
    count,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - count),
    resetInSeconds,
  };
};
