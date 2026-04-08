import { Router } from "express";
import apiKeysRouter from "./apiKeys";
import rateLimitsRouter from "./rateLimits";

const router = Router();

router.use("/keys", apiKeysRouter);
router.use("/limits", rateLimitsRouter);

// added day by day:
// router.use('/logs',    logsRouter);
// router.use('/blocks',  blocksRouter);
// router.use('/metrics', metricsRouter);

export default router;
