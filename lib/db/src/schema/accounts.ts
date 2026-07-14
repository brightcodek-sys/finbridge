import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// each bank account belongs to a user
// balance is stored as a string (numeric) so we don't lose precision
export const bankAccountsTable = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountType: text("account_type").notNull().default("savings"), // savings | current | wallet
  balance: numeric("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("NGN"),
  isActive: boolean("is_active").notNull().default(true),
  connectedAt: timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBankAccountSchema = createInsertSchema(bankAccountsTable).omit({
  id: true,
  connectedAt: true,
});

export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccountsTable.$inferSelect;
