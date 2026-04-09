import { Router } from "express";
import apiKeysRouter from "./apiKeys";
import rateLimitsRouter from "./rateLimits";
import blocksRouter from "./blocks";

const router = Router();

router.use("/keys", apiKeysRouter);
router.use("/limits", rateLimitsRouter);
router.use("/blocks", blocksRouter);

// added day by day:
// router.use('/logs',    logsRouter);
// router.use('/metrics', metricsRouter);

export default router;
