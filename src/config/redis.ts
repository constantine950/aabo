import { createClient } from "redis";
import { config } from "./index";

export const redis = createClient({ url: config.redisUrl });

redis.on("error", (err) => {
  console.error("[redis] error:", err);
});

export const connectRedis = async (): Promise<void> => {
  await redis.connect();
  console.log("[redis] connected successfully");
};
