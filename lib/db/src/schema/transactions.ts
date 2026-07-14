import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { bankAccountsTable } from "./accounts";
import { usersTable } from "./users";

// every transaction belongs to a bank account and also a user for easy querying
export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  accountId: integer("account_id").notNull().references(() => bankAccountsTable.id),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  type: text("type").notNull(), // credit | debit
  category: text("category").notNull(), // food, transport, bills, etc.
  description: text("description").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("completed"), // completed | pending | failed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
