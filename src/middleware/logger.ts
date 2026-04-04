import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { RequestLogModel } from "../models/RequestLog";

export const logger = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();

  res.on("finish", () => {
    const response_ms = Date.now() - start;

    RequestLogModel.create({
      ip: req.ip ?? null,
      api_key_id: req.apiKey?.id ?? null,
      route: req.path,
      method: req.method,
      status_code: res.statusCode,
      blocked: res.statusCode === 429 || res.statusCode === 403,
      response_ms,
    }).catch((err) => {
      console.error("[logger] failed to write log:", err);
    });
  });

  next();
};
