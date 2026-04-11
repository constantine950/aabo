import { Router } from "express";
import apiKeysRouter from "./apiKeys";
import rateLimitsRouter from "./rateLimits";
import blocksRouter from "./blocks";
import logsRouter from "./logs";
import metricsRouter from "./metrics";

const router = Router();

router.use("/keys", apiKeysRouter);
router.use("/limits", rateLimitsRouter);
router.use("/blocks", blocksRouter);
router.use("/logs", logsRouter);
router.use("/metrics", metricsRouter);

export default router;
