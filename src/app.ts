import express, { Application } from "express";
import { authenticate } from "./middleware/auth";
import { logger } from "./middleware/logger";
import { rateLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import router from "./routes";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(
  "/api",
  authenticate,
  logger,
  rateLimiter({
    strategy: "sliding_window",
    maxRequests: 100,
    windowSeconds: 60,
  }),
  router,
);

app.use(errorHandler);

export default app;
