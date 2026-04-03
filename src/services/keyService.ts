import crypto from "crypto";
import { config } from "../config";

export const generateKey = (): string => {
  return `aabo_${crypto.randomBytes(24).toString("hex")}`;
};

export const hashKey = (key: string): string => {
  return crypto
    .createHmac("sha256", config.apiKeySecret)
    .update(key)
    .digest("hex");
};
