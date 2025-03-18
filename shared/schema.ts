import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  referralCode: text("referral_code").notNull().unique(), // Unique referral code for each user
  referredBy: text("referred_by"), // Referral code of the user who referred this user
});

export const miningPlans = pgTable("mining_plans", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  withdrawalAddress: text("withdrawal_address").notNull(),
  planType: text("plan_type").notNull(), // 'daily' or 'weekly'
  amount: text("amount").notNull(), // USDT amount in string format
  dailyRewardCPXTB: text("daily_reward_cpxtb").notNull(),
  activatedAt: timestamp("activated_at").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  transactionHash: text("transaction_hash").notNull(),
  hasWithdrawn: boolean("has_withdrawn").notNull().default(false),
  referralCode: text("referral_code"), // Track which referral code was used
  referralRewardPaid: boolean("referral_reward_paid").default(false), // Track if referral reward has been paid
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
}).extend({
  referralCode: z.string().optional(), // Used when referring others
  referredBy: z.string().optional(), // Used when being referred
});

// Update the mining plan schema to be more strict about referral codes
export const insertMiningPlanSchema = createInsertSchema(miningPlans)
  .omit({ 
    id: true,
    isActive: true,
    hasWithdrawn: true,
    referralRewardPaid: true
  })
  .extend({
    amount: z.string(), // Make sure amount is handled as string
    planType: z.enum(['daily', 'weekly']), // Add validation for plan types
    activatedAt: z.string().transform((str) => new Date(str)), // Transform ISO string to Date
    expiresAt: z.string().transform((str) => new Date(str)), // Transform ISO string to Date
    referralCode: z.string().nullable(), // Must be explicitly null or a valid string
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMiningPlan = z.infer<typeof insertMiningPlanSchema>;
export type MiningPlan = typeof miningPlans.$inferSelect;