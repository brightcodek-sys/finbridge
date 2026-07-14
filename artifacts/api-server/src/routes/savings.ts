// savings goals route - personal savings goals with auto-deduct option
import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, savingsGoalsTable } from "@workspace/db";
import {
  ListSavingsGoalsResponse,
  CreateSavingsGoalBody,
  CreateSavingsGoalResponse,
  GetSavingsGoalParams,
  GetSavingsGoalResponse,
  UpdateSavingsGoalParams,
  UpdateSavingsGoalBody,
  UpdateSavingsGoalResponse,
  DeleteSavingsGoalParams,
  DeleteSavingsGoalResponse,
  ContributeToGoalParams,
  ContributeToGoalBody,
  ContributeToGoalResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const DEMO_USER_ID = 1;

// helper to convert DB row to the shape the API returns
function formatGoal(goal: typeof savingsGoalsTable.$inferSelect) {
  return {
    ...goal,
    targetAmount: parseFloat(goal.targetAmount as string),
    currentAmount: parseFloat(goal.currentAmount as string),
    autoDeductAmount: goal.autoDeductAmount ? parseFloat(goal.autoDeductAmount as string) : null,
    deadline: goal.deadline ?? null,
  };
}

// list all savings goals
router.get("/savings", async (req, res): Promise<void> => {
  const goals = await db
    .select()
    .from(savingsGoalsTable)
    .where(eq(savingsGoalsTable.userId, DEMO_USER_ID))
    .orderBy(savingsGoalsTable.createdAt);

  res.json(ListSavingsGoalsResponse.parse(goals.map(formatGoal)));
});

// create a new savings goal
router.post("/savings", async (req, res): Promise<void> => {
  const parsed = CreateSavingsGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // deadline comes in as Date | null from Zod but drizzle date column wants YYYY-MM-DD string
  const deadlineStr = parsed.data.deadline
    ? (parsed.data.deadline instanceof Date
        ? parsed.data.deadline.toISOString().split("T")[0]
        : String(parsed.data.deadline).split("T")[0])
    : null;

  const [goal] = await db
    .insert(savingsGoalsTable)
    .values({
      userId: DEMO_USER_ID,
      name: parsed.data.name,
      targetAmount: parsed.data.targetAmount.toString(),
      currentAmount: "0",
      deadline: deadlineStr,
      autoDeductAmount: parsed.data.autoDeductAmount?.toString() ?? null,
      autoDeductEnabled: parsed.data.autoDeductEnabled ?? false,
    })
    .returning();

  res.status(201).json(CreateSavingsGoalResponse.parse(formatGoal(goal)));
});

// get a single savings goal
router.get("/savings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetSavingsGoalParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [goal] = await db
    .select()
    .from(savingsGoalsTable)
    .where(and(
      eq(savingsGoalsTable.id, params.data.id),
      eq(savingsGoalsTable.userId, DEMO_USER_ID)
    ));

  if (!goal) {
    res.status(404).json({ error: "Savings goal not found" });
    return;
  }

  res.json(GetSavingsGoalResponse.parse(formatGoal(goal)));
});

// update a savings goal
router.patch("/savings/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateSavingsGoalParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateSavingsGoalBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  // build the update object (only include fields that were sent)
  const updates: Partial<typeof savingsGoalsTable.$inferInsert> = {};
  if (body.data.name !== undefined) updates.name = body.data.name;
  if (body.data.targetAmount !== undefined) updates.targetAmount = body.data.targetAmount.toString();
  if (body.data.deadline !== undefined) {
    const d = body.data.deadline;
    updates.deadline = d
      ? (d instanceof Date ? d.toISOString().split("T")[0] : String(d).split("T")[0])
      : null;
  }
  if (body.data.autoDeductAmount !== undefined) updates.autoDeductAmount = body.data.autoDeductAmount?.toString() ?? null;
  if (body.data.autoDeductEnabled !== undefined) updates.autoDeductEnabled = body.data.autoDeductEnabled;

  const [updated] = await db
    .update(savingsGoalsTable)
    .set(updates)
    .where(and(
      eq(savingsGoalsTable.id, params.data.id),
      eq(savingsGoalsTable.userId, DEMO_USER_ID)
    ))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Savings goal not found" });
    return;
  }

  res.json(UpdateSavingsGoalResponse.parse(formatGoal(updated)));
});

// delete a savings goal
router.delete("/savings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteSavingsGoalParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(savingsGoalsTable)
    .where(and(
      eq(savingsGoalsTable.id, params.data.id),
      eq(savingsGoalsTable.userId, DEMO_USER_ID)
    ))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Savings goal not found" });
    return;
  }

  res.json(DeleteSavingsGoalResponse.parse({ message: "Savings goal deleted" }));
});

// add money to a savings goal (contribute)
router.post("/savings/:id/contribute", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ContributeToGoalParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ContributeToGoalBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [goal] = await db
    .select()
    .from(savingsGoalsTable)
    .where(and(
      eq(savingsGoalsTable.id, params.data.id),
      eq(savingsGoalsTable.userId, DEMO_USER_ID)
    ));

  if (!goal) {
    res.status(404).json({ error: "Savings goal not found" });
    return;
  }

  const newAmount = parseFloat(goal.currentAmount as string) + body.data.amount;

  const [updated] = await db
    .update(savingsGoalsTable)
    .set({ currentAmount: newAmount.toString() })
    .where(eq(savingsGoalsTable.id, params.data.id))
    .returning();

  res.json(ContributeToGoalResponse.parse(formatGoal(updated)));
});

export default router;
