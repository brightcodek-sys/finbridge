// dashboard route - aggregates all the data into one summary view
// this is the "intelligent action" layer from the hackathon brief
import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, usersTable, bankAccountsTable, transactionsTable, savingsGoalsTable, groupMembershipsTable, financialInsightsTable } from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const DEMO_USER_ID = 1;

// get all the numbers needed for the main dashboard view
router.get("/dashboard/summary", async (req, res): Promise<void> => {
  // run all queries in parallel - much faster this way
  const [
    userResult,
    accountsResult,
    totalBalanceResult,
    totalSavingsResult,
    monthlyIncomeResult,
    monthlyExpensesResult,
    recentTransactions,
    activeGroupsResult,
    insightCountResult,
  ] = await Promise.all([
    // get user for financial health score
    db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID)).limit(1),

    // count connected accounts
    db.select({ count: sql<number>`count(*)::int` })
      .from(bankAccountsTable)
      .where(eq(bankAccountsTable.userId, DEMO_USER_ID)),

    // sum all bank account balances
    db.select({ total: sql<string>`COALESCE(SUM(balance), 0)` })
      .from(bankAccountsTable)
      .where(eq(bankAccountsTable.userId, DEMO_USER_ID)),

    // sum all savings goals current amounts
    db.select({ total: sql<string>`COALESCE(SUM(current_amount), 0)` })
      .from(savingsGoalsTable)
      .where(eq(savingsGoalsTable.userId, DEMO_USER_ID)),

    // monthly income (credits in the last 30 days)
    db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(transactionsTable)
      .where(and(
        eq(transactionsTable.userId, DEMO_USER_ID),
        eq(transactionsTable.type, "credit"),
        sql`date >= NOW() - INTERVAL '30 days'`
      )),

    // monthly expenses (debits in the last 30 days)
    db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(transactionsTable)
      .where(and(
        eq(transactionsTable.userId, DEMO_USER_ID),
        eq(transactionsTable.type, "debit"),
        sql`date >= NOW() - INTERVAL '30 days'`
      )),

    // get 5 most recent transactions
    db.select({
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
      .where(eq(transactionsTable.userId, DEMO_USER_ID))
      .orderBy(desc(transactionsTable.date))
      .limit(5),

    // count community groups the user is in
    db.select({ count: sql<number>`count(*)::int` })
      .from(groupMembershipsTable)
      .where(eq(groupMembershipsTable.userId, DEMO_USER_ID)),

    // count unread insights
    db.select({ count: sql<number>`count(*)::int` })
      .from(financialInsightsTable)
      .where(eq(financialInsightsTable.userId, DEMO_USER_ID)),
  ]);

  const user = userResult[0];
  const totalBalance = parseFloat(totalBalanceResult[0]?.total ?? "0");
  const totalSavings = parseFloat(totalSavingsResult[0]?.total ?? "0");
  const monthlyIncome = parseFloat(monthlyIncomeResult[0]?.total ?? "0");
  const monthlyExpenses = parseFloat(monthlyExpensesResult[0]?.total ?? "0");

  // savings rate = (income - expenses) / income * 100, capped at 0
  const savingsRate = monthlyIncome > 0
    ? Math.max(0, Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100))
    : 0;

  const formattedTransactions = recentTransactions.map(t => ({
    ...t,
    amount: parseFloat(t.amount as string),
    bankName: t.bankName ?? null,
  }));

  res.json(GetDashboardSummaryResponse.parse({
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    financialHealthScore: user?.financialHealthScore ?? 50,
    totalSavings,
    activeGroupsCount: activeGroupsResult[0]?.count ?? 0,
    accountsCount: accountsResult[0]?.count ?? 0,
    recentTransactions: formattedTransactions,
    insightCount: insightCountResult[0]?.count ?? 0,
  }));
});

export default router;
