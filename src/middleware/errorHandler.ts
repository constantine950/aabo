import { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  status?: number;
  code?: string;
  type?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error(`[error] ${req.method} ${req.path} —`, err.message);

  // Postgres unique violation
  if (err.code === "23505") {
    res.status(409).json({ error: "Resource already exists" });
    return;
  }

  // Postgres foreign key violation
  if (err.code === "23503") {
    res.status(400).json({ error: "Referenced resource does not exist" });
    return;
  }

  // JSON parse error
  if (err.type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  const status = err.status ?? 500;
  const message = status < 500 ? err.message : "Internal server error";

  res.status(status).json({ error: message });
};
