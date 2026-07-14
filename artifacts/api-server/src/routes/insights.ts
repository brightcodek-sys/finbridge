// insights route - financial insights and recommendations for the user
// these would normally be AI-generated based on spending patterns
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, financialInsightsTable } from "@workspace/db";
import { ListInsightsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const DEMO_USER_ID = 1;

// list all insights for the current user
router.get("/insights", async (req, res): Promise<void> => {
  const insights = await db
    .select()
    .from(financialInsightsTable)
    .where(eq(financialInsightsTable.userId, DEMO_USER_ID))
    .orderBy(financialInsightsTable.createdAt);

  res.json(ListInsightsResponse.parse(insights));
});

export default router;
