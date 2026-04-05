import dotenv from "dotenv";
dotenv.config();

import { db, connectDb } from "../src/config/database";
import { generateKey, hashKey } from "../src/services/keyService";

const seed = async (): Promise<void> => {
  await connectDb();

  const existing = await db.query(
    `SELECT id FROM api_keys WHERE name = 'admin' LIMIT 1`,
  );

  if (existing.rows.length > 0) {
    console.log("[seed] admin key already exists, skipping.");
    await db.end();
    return;
  }

  const raw = generateKey();
  const hash = hashKey(raw);

  await db.query(`INSERT INTO api_keys (key_hash, name) VALUES ($1, $2)`, [
    hash,
    "admin",
  ]);

  console.log("[seed] admin key created.");
  console.log("[seed] key:", raw);
  console.log("[seed] save this — it will not be shown again.");

  await db.end();
};

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
