import { pgTable, text, serial, timestamp, integer, numeric, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// ajo/esusu group — a rotating savings club where everyone contributes and takes turns getting the pot
export const communityGroupsTable = pgTable("community_groups", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  contributionAmount: numeric("contribution_amount", { precision: 15, scale: 2 }).notNull(),
  cycleDays: integer("cycle_days").notNull().default(30), // how many days per cycle
  totalPool: numeric("total_pool", { precision: 15, scale: 2 }).notNull().default("0"),
  nextPayoutDate: date("next_payout_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCommunityGroupSchema = createInsertSchema(communityGroupsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertCommunityGroup = z.infer<typeof insertCommunityGroupSchema>;
export type CommunityGroup = typeof communityGroupsTable.$inferSelect;

// who is in which group
export const groupMembershipsTable = pgTable("group_memberships", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => communityGroupsTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  rotationOrder: integer("rotation_order").notNull().default(0), // which turn they get the pot
  hasPaidCurrentCycle: boolean("has_paid_current_cycle").notNull().default(false),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGroupMembershipSchema = createInsertSchema(groupMembershipsTable).omit({
  id: true,
  joinedAt: true,
});

export type InsertGroupMembership = z.infer<typeof insertGroupMembershipSchema>;
export type GroupMembership = typeof groupMembershipsTable.$inferSelect;
