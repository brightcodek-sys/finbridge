// users route - handles /users/me and KYC upgrades
// the default user is always id=1 for this hackathon demo (no auth needed)
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  GetMeResponse,
  UpdateMeBody,
  UpdateMeResponse,
  SubmitKycBody,
  SubmitKycResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// always use user id 1 for the demo
const DEMO_USER_ID = 1;

// get current user profile
router.get("/users/me", async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, DEMO_USER_ID));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetMeResponse.parse({
    ...user,
    phone: user.phone ?? null,
    bvn: user.bvn ?? null,
  }));
});

// update user profile (name, phone)
router.patch("/users/me", async (req, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, DEMO_USER_ID))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(UpdateMeResponse.parse({
    ...updated,
    phone: updated.phone ?? null,
    bvn: updated.bvn ?? null,
  }));
});

// submit KYC upgrade - basic → intermediate → full
// each tier unlocks more features
router.post("/users/me/kyc", async (req, res): Promise<void> => {
  const parsed = SubmitKycBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // figure out what to update based on the requested tier
  const updates: Partial<typeof usersTable.$inferInsert> = {
    kycTier: parsed.data.tier,
  };

  if (parsed.data.bvn) updates.bvn = parsed.data.bvn;
  if (parsed.data.nin) updates.nin = parsed.data.nin;
  if (parsed.data.address) updates.address = parsed.data.address;

  // bump the financial health score when user upgrades KYC
  const tierScore: Record<string, number> = {
    intermediate: 65,
    full: 85,
  };
  updates.financialHealthScore = tierScore[parsed.data.tier] ?? 50;

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, DEMO_USER_ID))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(SubmitKycResponse.parse({
    ...updated,
    phone: updated.phone ?? null,
    bvn: updated.bvn ?? null,
  }));
});

export default router;
