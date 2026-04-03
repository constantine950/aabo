import { Pool } from "pg";
import { config } from "./index";

export const db = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

db.on("error", (err) => {
  console.error("[database] unexpected error on idle client:", err);
  process.exit(-1);
});

export const connectDb = async (): Promise<void> => {
  const client = await db.connect();
  client.release();
  console.log("[database] connected successfully");
};
