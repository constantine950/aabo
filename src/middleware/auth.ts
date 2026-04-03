import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { ApiKeyModel } from "../models/ApiKey";
import { hashKey } from "../services/keyService";

const extractKey = (req: AuthenticatedRequest): string | null => {
  const xApiKey = req.headers["x-api-key"];
  if (xApiKey && typeof xApiKey === "string") return xApiKey;

  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
};

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const raw = extractKey(req);

  if (!raw) {
    res.status(401).json({ error: "Missing API key" });
    return;
  }

  const hash = hashKey(raw);
  const apiKey = await ApiKeyModel.findByHash(hash);

  if (!apiKey) {
    res.status(401).json({ error: "Invalid or inactive API key" });
    return;
  }

  req.apiKey = apiKey;
  next();
};
