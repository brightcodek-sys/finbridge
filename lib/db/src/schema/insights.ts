import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// financial insights generated for users — warnings, tips, achievements, alerts
export const financialInsightsTable = pgTable("financial_insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  type: text("type").notNull(), // warning | tip | achievement | alert
  title: text("title").notNull(),
  description: text("description").notNull(),
  recommendation: text("recommendation").notNull(),
  impact: text("impact").notNull().default("medium"), // high | medium | low
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFinancialInsightSchema = createInsertSchema(financialInsightsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertFinancialInsight = z.infer<typeof insertFinancialInsightSchema>;
export type FinancialInsight = typeof financialInsightsTable.$inferSelect;
