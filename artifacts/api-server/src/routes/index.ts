import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import accountsRouter from "./accounts";
import transactionsRouter from "./transactions";
import savingsRouter from "./savings";
import communityRouter from "./community";
import insightsRouter from "./insights";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(accountsRouter);
router.use(transactionsRouter);
router.use(savingsRouter);
router.use(communityRouter);
router.use(insightsRouter);
router.use(dashboardRouter);

export default router;
