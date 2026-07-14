// transactions route - handles transaction history + spending analytics
// the analytics endpoint is the "wow" feature - turns raw data into insights
import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, transactionsTable, bankAccountsTable } from "@workspace/db";
import {
  ListTransactionsQueryParams,
  ListTransactionsResponse,
  CreateTransactionBody,
  CreateTransactionResponse,
  GetTransactionAnalyticsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const DEMO_USER_ID = 1;

// list transactions with filtering and pagination
router.get("/transactions", async (req, res): Promise<void> => {
  const queryParsed = ListTransactionsQueryParams.safeParse(req.query);
  if (!queryParsed.success) {
    res.status(400).json({ error: queryParsed.error.message });
    return;
  }

  const { limit = 20, offset = 0, accountId, category, type } = queryParsed.data;

  // build up where conditions
  const conditions = [eq(transactionsTable.userId, DEMO_USER_ID)];
  if (accountId) conditions.push(eq(transactionsTable.accountId, accountId));
  if (category) conditions.push(eq(transactionsTable.category, category));
  if (type) conditions.push(eq(transactionsTable.type, type));

  // get total count first
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactionsTable)
    .where(and(...conditions));

  const total = countResult[0]?.count ?? 0;

  // then get the actual transactions with bank name joined
  const txns = await db
    .select({
      id: transactionsTable.id,
      accountId: transactionsTable.accountId,
      amount: transactionsTable.amount,
      type: transactionsTable.type,
      category: transactionsTable.category,
      description: transactionsTable.description,
      date: transactionsTable.date,
      status: transactionsTable.status,
      bankName: bankAccountsTable.bankName,
    })
    .from(transactionsTable)
    .leftJoin(bankAccountsTable, eq(transactionsTable.accountId, bankAccountsTable.id))
    .where(and(...conditions))
    .orderBy(desc(transactionsTable.date))
    .limit(limit)
    .offset(offset);

  const parsed = txns.map(t => ({
    ...t,
    amount: parseFloat(t.amount as string),
    bankName: t.bankName ?? null,
  }));

  res.json(ListTransactionsResponse.parse({
    transactions: parsed,
    total,
    limit,
    offset,
  }));
});

// create a manual transaction record
router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [txn] = await db
    .insert(transactionsTable)
    .values({
      userId: DEMO_USER_ID,
      accountId: parsed.data.accountId,
      amount: parsed.data.amount.toString(),
      type: parsed.data.type,
      category: parsed.data.category,
      description: parsed.data.description,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      status: "completed",
    })
    .returning();

  res.status(201).json(CreateTransactionResponse.parse({
    ...txn,
    amount: parseFloat(txn.amount as string),
    bankName: null,
  }));
});

// spending analytics for the last 30 days - grouped by category
// this is the "open banking intelligence" part of the hackathon challenge
router.get("/transactions/analytics", async (req, res): Promise<void> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // total spend (debits)
  const spendResult = await db
    .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(transactionsTable)
    .where(and(
      eq(transactionsTable.userId, DEMO_USER_ID),
      eq(transactionsTable.type, "debit"),
      sql`date >= ${thirtyDaysAgo.toISOString()}`
    ));

  // total income (credits)
  const incomeResult = await db
    .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(transactionsTable)
    .where(and(
      eq(transactionsTable.userId, DEMO_USER_ID),
      eq(transactionsTable.type, "credit"),
      sql`date >= ${thirtyDaysAgo.toISOString()}`
    ));

  const totalSpend = parseFloat(spendResult[0]?.total ?? "0");
  const totalIncome = parseFloat(incomeResult[0]?.total ?? "0");

  // spending breakdown by category
  const categoryBreakdown = await db
    .select({
      category: transactionsTable.category,
      amount: sql<string>`SUM(amount)`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(transactionsTable)
    .where(and(
      eq(transactionsTable.userId, DEMO_USER_ID),
      eq(transactionsTable.type, "debit"),
      sql`date >= ${thirtyDaysAgo.toISOString()}`
    ))
    .groupBy(transactionsTable.category)
    .orderBy(sql`SUM(amount) DESC`);

  // calculate percentages
  const byCategory = categoryBreakdown.map(row => ({
    category: row.category,
    amount: parseFloat(row.amount as string),
    count: row.count,
    percentage: totalSpend > 0 ? Math.round((parseFloat(row.amount as string) / totalSpend) * 100) : 0,
  }));

  res.json(GetTransactionAnalyticsResponse.parse({
    totalSpend,
    totalIncome,
    byCategory,
    periodDays: 30,
  }));
});

export default router;
