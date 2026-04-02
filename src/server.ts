import { config } from "./config";
import { connectDb } from "./config/database";
import { connectRedis } from "./config/redis";
import app from "./app";

const start = async (): Promise<void> => {
  await connectDb();
  await connectRedis();

  app.listen(config.port, () => {
    console.log(
      `[server] Ààbò running on port ${config.port} (${config.nodeEnv})`,
    );
  });
};

start().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
