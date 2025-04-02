import { pgTable, text, serial, integer, boolean, timestamp, real, numeric, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  lastCPXTBClaimTime: timestamp("last_cpxtb_claim_time"),
  lastClaimIp: text("last_claim_ip"),
  ipClaimTime: timestamp("ip_claim_time"),
  accumulatedCPXTB: numeric("accumulated_cpxtb", { precision: 10, scale: 3 }).default("0"), // Changed to numeric for better precision
});

export const miningPlans = pgTable("mining_plans", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  withdrawalAddress: text("withdrawal_address").notNull(),
  planType: text("plan_type").notNull(),
  amount: text("amount").notNull(),
  dailyRewardCPXTB: text("daily_reward_cpxtb").notNull(),
  activatedAt: timestamp("activated_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  transactionHash: text("transaction_hash").notNull(),
  hasWithdrawn: boolean("has_withdrawn").notNull().default(false),
  referralCode: text("referral_code"),
  referralRewardPaid: boolean("referral_reward_paid").default(false),
});

export const gameScores = pgTable("game_scores", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  score: integer("score").notNull(),
  earnedCPXTB: numeric("earned_cpxtb", { precision: 10, scale: 3 }).notNull(),
  gameType: varchar("game_type", { length: 30 }).default("space-mining"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  recommendation_type: text("recommendation_type").notNull(),
  content: text("content").notNull(),
  context: jsonb("context"),
  is_implemented: boolean("is_implemented").default(false),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Update user schema
export const insertUserSchema = createInsertSchema(users)
  .extend({
    username: z.string(),
    password: z.string(),
    referralCode: z.string(),
    referredBy: z.string().optional(),
    lastCPXTBClaimTime: z.date().nullable().optional(),
    lastClaimIp: z.string().nullable().optional(),
    ipClaimTime: z.date().nullable().optional(),
    accumulatedCPXTB: z.number().default(0), 
  });

export const insertMiningPlanSchema = createInsertSchema(miningPlans)
  .omit({ 
    id: true,
    isActive: true,
    hasWithdrawn: true,
    referralRewardPaid: true,
    createdAt: true
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

export const insertGameScoreSchema = createInsertSchema(gameScores)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    walletAddress: z.string(),
    score: z.number().int().positive(),
    earnedCPXTB: z.number().positive(),
    gameType: z.enum(['space-mining', 'memory-match']).default('space-mining'),
  });

export type InsertMiningPlan = z.infer<typeof insertMiningPlanSchema>;
export type MiningPlan = typeof miningPlans.$inferSelect;

export type InsertGameScore = z.infer<typeof insertGameScoreSchema>;
export type GameScore = typeof gameScores.$inferSelect;

export const insertRecommendationSchema = createInsertSchema(recommendations)
  .omit({
    id: true,
    created_at: true,
    is_implemented: true,
    is_read: true,
  })
  .extend({
    user_id: z.number().int().positive(),
    recommendation_type: z.string(),
    content: z.string(),
    context: z.record(z.any()).optional(),
  });

export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendations.$inferSelect;