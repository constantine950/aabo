import { Pool } from "pg";
import { config } from "./index";

export const db = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

db.on("error", (err) => {
  console.error("[db] unexpected error on idle client:", err);
});

export const connectDb = async (): Promise<void> => {
  const client = await db.connect();
  client.release();
  console.log("[db] connected");
};
