import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  lastCPXTBClaimTime: timestamp("last_cpxtb_claim_time"),
});

export const miningPlans = pgTable("mining_plans", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  withdrawalAddress: text("withdrawal_address").notNull(),
  planType: text("plan_type").notNull(),
  amount: text("amount").notNull(),
  dailyRewardCPXTB: text("daily_reward_cpxtb").notNull(),
  activatedAt: timestamp("activated_at").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  transactionHash: text("transaction_hash").notNull(),
  hasWithdrawn: boolean("has_withdrawn").notNull().default(false),
  referralCode: text("referral_code"),
  referralRewardPaid: boolean("referral_reward_paid").default(false),
});

// Update user schema
export const insertUserSchema = createInsertSchema(users)
  .extend({
    username: z.string(),
    password: z.string(),
    referralCode: z.string(),
    referredBy: z.string().optional(),
    lastCPXTBClaimTime: z.date().nullable().optional(),
  });

export const insertMiningPlanSchema = createInsertSchema(miningPlans)
  .omit({ 
    id: true,
    isActive: true,
    hasWithdrawn: true,
    referralRewardPaid: true
  })
  .extend({
    amount: z.string(),
    planType: z.enum(['bronze', 'silver', 'gold']), 
    activatedAt: z.union([z.date(), z.string()]).transform(val => 
      val instanceof Date ? val : new Date(val)
    ),
    expiresAt: z.union([z.date(), z.string()]).transform(val => 
      val instanceof Date ? val : new Date(val)
    ),
    referralCode: z.string().nullable().optional(),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMiningPlan = z.infer<typeof insertMiningPlanSchema>;
export type MiningPlan = typeof miningPlans.$inferSelect;