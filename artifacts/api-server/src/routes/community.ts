// community route - ajo/esusu rotating savings groups
// this is the financial inclusion feature - bringing informal savings into formal banking
import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { db, communityGroupsTable, groupMembershipsTable, usersTable } from "@workspace/db";
import {
  ListCommunityGroupsResponse,
  CreateCommunityGroupBody,
  CreateCommunityGroupResponse,
  GetCommunityGroupParams,
  GetCommunityGroupResponse,
  JoinCommunityGroupParams,
  JoinCommunityGroupResponse,
  ContributeToGroupParams,
  ContributeToGroupBody,
  ContributeToGroupResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const DEMO_USER_ID = 1;

// helper to format a group row for the API response
async function formatGroup(group: typeof communityGroupsTable.$inferSelect, userId: number) {
  // count members
  const memberCountResult = await db
    .select({ count: count() })
    .from(groupMembershipsTable)
    .where(eq(groupMembershipsTable.groupId, group.id));

  const memberCount = memberCountResult[0]?.count ?? 0;

  // check if current user is a member
  const membership = await db
    .select()
    .from(groupMembershipsTable)
    .where(and(
      eq(groupMembershipsTable.groupId, group.id),
      eq(groupMembershipsTable.userId, userId)
    ));

  const isMember = membership.length > 0;

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    contributionAmount: parseFloat(group.contributionAmount as string),
    cycleDays: group.cycleDays,
    totalPool: parseFloat(group.totalPool as string),
    memberCount,
    nextPayoutDate: group.nextPayoutDate ?? null,
    isMember,
    createdAt: group.createdAt,
  };
}

// list all community groups
router.get("/community", async (req, res): Promise<void> => {
  const groups = await db
    .select()
    .from(communityGroupsTable)
    .orderBy(communityGroupsTable.createdAt);

  const formatted = await Promise.all(groups.map(g => formatGroup(g, DEMO_USER_ID)));

  res.json(ListCommunityGroupsResponse.parse(formatted));
});

// create a new ajo/esusu group
router.post("/community", async (req, res): Promise<void> => {
  const parsed = CreateCommunityGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // figure out when the first payout would be
  const nextPayout = new Date();
  nextPayout.setDate(nextPayout.getDate() + parsed.data.cycleDays);
  const nextPayoutStr = nextPayout.toISOString().split("T")[0]; // YYYY-MM-DD

  const [group] = await db
    .insert(communityGroupsTable)
    .values({
      creatorId: DEMO_USER_ID,
      name: parsed.data.name,
      description: parsed.data.description,
      contributionAmount: parsed.data.contributionAmount.toString(),
      cycleDays: parsed.data.cycleDays,
      totalPool: "0",
      nextPayoutDate: nextPayoutStr,
    })
    .returning();

  // creator automatically becomes the first member
  await db.insert(groupMembershipsTable).values({
    groupId: group.id,
    userId: DEMO_USER_ID,
    rotationOrder: 1,
    hasPaidCurrentCycle: false,
  });

  const formatted = await formatGroup(group, DEMO_USER_ID);
  res.status(201).json(CreateCommunityGroupResponse.parse(formatted));
});

// get a community group with all its members
router.get("/community/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetCommunityGroupParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [group] = await db
    .select()
    .from(communityGroupsTable)
    .where(eq(communityGroupsTable.id, params.data.id));

  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  // get all members with their user names
  const members = await db
    .select({
      id: groupMembershipsTable.id,
      userId: groupMembershipsTable.userId,
      name: usersTable.name,
      rotationOrder: groupMembershipsTable.rotationOrder,
      hasPaidCurrentCycle: groupMembershipsTable.hasPaidCurrentCycle,
      joinedAt: groupMembershipsTable.joinedAt,
    })
    .from(groupMembershipsTable)
    .leftJoin(usersTable, eq(groupMembershipsTable.userId, usersTable.id))
    .where(eq(groupMembershipsTable.groupId, params.data.id))
    .orderBy(groupMembershipsTable.rotationOrder);

  const formatted = await formatGroup(group, DEMO_USER_ID);

  res.json(GetCommunityGroupResponse.parse({
    ...formatted,
    members: members.map(m => ({
      ...m,
      name: m.name ?? "Unknown Member",
    })),
  }));
});

// join a community group
router.post("/community/:id/join", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = JoinCommunityGroupParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [group] = await db
    .select()
    .from(communityGroupsTable)
    .where(eq(communityGroupsTable.id, params.data.id));

  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  // check if already a member
  const existing = await db
    .select()
    .from(groupMembershipsTable)
    .where(and(
      eq(groupMembershipsTable.groupId, params.data.id),
      eq(groupMembershipsTable.userId, DEMO_USER_ID)
    ));

  if (existing.length > 0) {
    res.status(400).json({ error: "Already a member of this group" });
    return;
  }

  // figure out what rotation order to give this new member
  const memberCountResult = await db
    .select({ count: count() })
    .from(groupMembershipsTable)
    .where(eq(groupMembershipsTable.groupId, params.data.id));

  const currentCount = memberCountResult[0]?.count ?? 0;

  await db.insert(groupMembershipsTable).values({
    groupId: params.data.id,
    userId: DEMO_USER_ID,
    rotationOrder: currentCount + 1,
    hasPaidCurrentCycle: false,
  });

  const formatted = await formatGroup(group, DEMO_USER_ID);
  res.json(JoinCommunityGroupResponse.parse(formatted));
});

// make a contribution to a group (simulate paying your cycle contribution)
router.post("/community/:id/contribute", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ContributeToGroupParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ContributeToGroupBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [group] = await db
    .select()
    .from(communityGroupsTable)
    .where(eq(communityGroupsTable.id, params.data.id));

  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  // add contribution to the total pool
  const newTotal = parseFloat(group.totalPool as string) + body.data.amount;
  await db
    .update(communityGroupsTable)
    .set({ totalPool: newTotal.toString() })
    .where(eq(communityGroupsTable.id, params.data.id));

  // mark user as paid for this cycle
  await db
    .update(groupMembershipsTable)
    .set({ hasPaidCurrentCycle: true })
    .where(and(
      eq(groupMembershipsTable.groupId, params.data.id),
      eq(groupMembershipsTable.userId, DEMO_USER_ID)
    ));

  // reload and return updated group
  const [updatedGroup] = await db
    .select()
    .from(communityGroupsTable)
    .where(eq(communityGroupsTable.id, params.data.id));

  const formatted = await formatGroup(updatedGroup, DEMO_USER_ID);
  res.json(ContributeToGroupResponse.parse(formatted));
});

export default router;
