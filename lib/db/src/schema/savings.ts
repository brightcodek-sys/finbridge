import { pgTable, text, serial, timestamp, integer, numeric, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// personal savings goal — user sets a target and saves toward it
export const savingsGoalsTable = pgTable("savings_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount", { precision: 15, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  deadline: date("deadline", { mode: "string" }), // YYYY-MM-DD, optional
  autoDeductAmount: numeric("auto_deduct_amount", { precision: 15, scale: 2 }),
  autoDeductEnabled: boolean("auto_deduct_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSavingsGoalSchema = createInsertSchema(savingsGoalsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type SavingsGoal = typeof savingsGoalsTable.$inferSelect;
