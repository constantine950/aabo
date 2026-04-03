import { Router } from "express";
import apiKeysRouter from "./apiKeys";

const router = Router();

router.use("/keys", apiKeysRouter);

// remaining routes added day by day:
// router.use('/logs',    logsRouter);
// router.use('/blocks',  blocksRouter);
// router.use('/metrics', metricsRouter);

export default router;
