// accounts route - handles bank account connection and listing
// this simulates open banking - in real life we'd call bank APIs
import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, bankAccountsTable } from "@workspace/db";
import {
  ListAccountsResponse,
  ConnectAccountBody,
  ConnectAccountResponse,
  GetAccountParams,
  GetAccountResponse,
  DisconnectAccountParams,
  DisconnectAccountResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// always demo user id=1
const DEMO_USER_ID = 1;

// list all connected bank accounts for the current user
router.get("/accounts", async (req, res): Promise<void> => {
  const accounts = await db
    .select()
    .from(bankAccountsTable)
    .where(eq(bankAccountsTable.userId, DEMO_USER_ID))
    .orderBy(bankAccountsTable.connectedAt);

  // convert numeric balance string to number for the response
  const parsed = accounts.map(acc => ({
    ...acc,
    balance: parseFloat(acc.balance),
  }));

  res.json(ListAccountsResponse.parse(parsed));
});

// connect a new bank account (simulated - in real open banking we'd do OAuth)
router.post("/accounts", async (req, res): Promise<void> => {
  const parsed = ConnectAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // give the new account a realistic starting balance
  const startingBalance = (Math.random() * 500000 + 10000).toFixed(2);

  const [account] = await db
    .insert(bankAccountsTable)
    .values({
      userId: DEMO_USER_ID,
      bankName: parsed.data.bankName,
      accountNumber: parsed.data.accountNumber,
      accountType: parsed.data.accountType,
      balance: startingBalance,
      currency: "NGN",
      isActive: true,
    })
    .returning();

  res.status(201).json(ConnectAccountResponse.parse({
    ...account,
    balance: parseFloat(account.balance),
  }));
});

// get a single bank account by id
router.get("/accounts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAccountParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [account] = await db
    .select()
    .from(bankAccountsTable)
    .where(and(
      eq(bankAccountsTable.id, params.data.id),
      eq(bankAccountsTable.userId, DEMO_USER_ID)
    ));

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  res.json(GetAccountResponse.parse({
    ...account,
    balance: parseFloat(account.balance),
  }));
});

// disconnect a bank account (soft delete by setting isActive to false)
router.delete("/accounts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DisconnectAccountParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // just delete it outright for the demo
  const [deleted] = await db
    .delete(bankAccountsTable)
    .where(and(
      eq(bankAccountsTable.id, params.data.id),
      eq(bankAccountsTable.userId, DEMO_USER_ID)
    ))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  res.json(DisconnectAccountResponse.parse({ message: "Account disconnected successfully" }));
});

export default router;
