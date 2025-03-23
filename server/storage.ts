import { users, miningPlans, type User, type InsertUser, type MiningPlan, type InsertMiningPlan } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  getReferralStats(referralCode: string): Promise<{
    totalReferrals: number;
    totalRewards: string;
  }>;

  // Mining plan methods
  createMiningPlan(plan: InsertMiningPlan): Promise<MiningPlan>;
  getActiveMiningPlans(walletAddress: string): Promise<MiningPlan[]>;
  getMiningPlanByHash(transactionHash: string): Promise<MiningPlan | undefined>;
  deactivateExpiredPlans(): Promise<void>;
  markPlanAsWithdrawn(planId: number): Promise<MiningPlan>;
  getExpiredUnwithdrawnPlans(walletAddress: string): Promise<MiningPlan[]>;
  markReferralRewardPaid(planId: number): Promise<MiningPlan>;
  getReferralPlans(referralCode: string): Promise<MiningPlan[]>;
  // Update for CPXTB claims
  updateLastCPXTBClaimTime(username: string): Promise<User>;
  claimFreeCPXTB(username: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Generate unique referral code if not provided
    if (!insertUser.referralCode) {
      insertUser.referralCode = `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, code));
    return user;
  }

  async getReferralStats(referralCode: string): Promise<{ totalReferrals: number; totalRewards: string }> {
    // Get all plans with this referral code that have been activated
    const plans = await db
      .select()
      .from(miningPlans)
      .where(
        and(
          eq(miningPlans.referralCode, referralCode),
          eq(miningPlans.isActive, true) // Consider only activated plans
        )
      );

    // Count successful referrals (completed plans)
    const totalReferrals = plans.length;

    // Calculate total rewards (5% of each plan amount)
    const totalRewards = plans.reduce((sum, plan) => {
      const planAmount = parseFloat(plan.amount);
      return sum + (planAmount * 0.05);
    }, 0);

    return {
      totalReferrals,
      totalRewards: totalRewards.toFixed(2)
    };
  }

  // Mining plan methods
  async createMiningPlan(plan: InsertMiningPlan): Promise<MiningPlan> {
    const [newPlan] = await db.insert(miningPlans).values(plan).returning();
    return newPlan;
  }

  async getActiveMiningPlans(walletAddress: string): Promise<MiningPlan[]> {
    const normalizedAddress = walletAddress.toLowerCase();
    console.log('Fetching active plans for:', {
      walletAddress: normalizedAddress,
      currentTime: new Date().toISOString()
    });

    return await db
      .select()
      .from(miningPlans)
      .where(
        and(
          sql`LOWER(${miningPlans.walletAddress}) = ${normalizedAddress}`,
          eq(miningPlans.isActive, true),
          eq(miningPlans.hasWithdrawn, false),
          gte(miningPlans.expiresAt, new Date())  // Only return plans that haven't expired yet
        )
      )
      .orderBy(miningPlans.createdAt, "desc");
  }

  async getMiningPlanByHash(transactionHash: string): Promise<MiningPlan | undefined> {
    const [plan] = await db
      .select()
      .from(miningPlans)
      .where(eq(miningPlans.transactionHash, transactionHash));
    return plan;
  }

  async deactivateExpiredPlans(): Promise<void> {
    await db
      .update(miningPlans)
      .set({ isActive: false })
      .where(
        and(
          eq(miningPlans.isActive, true),
          gte(new Date(), miningPlans.expiresAt)
        )
      );
  }

  async markPlanAsWithdrawn(planId: number): Promise<MiningPlan> {
    const [updatedPlan] = await db
      .update(miningPlans)
      .set({
        hasWithdrawn: true,
        isActive: false  // Also mark the plan as inactive after withdrawal
      })
      .where(eq(miningPlans.id, planId))
      .returning();
    return updatedPlan;
  }

  async getExpiredUnwithdrawnPlans(walletAddress: string): Promise<MiningPlan[]> {
    const currentTime = new Date();
    console.log('Fetching expired plans for wallet:', {
      walletAddress,
      currentTime: currentTime.toISOString()
    });

    const plans = await db
      .select()
      .from(miningPlans)
      .where(
        and(
          eq(miningPlans.walletAddress, walletAddress),
          eq(miningPlans.hasWithdrawn, false),
          eq(miningPlans.isActive, true),
          gte(currentTime, miningPlans.expiresAt)  // Only return truly expired plans
        )
      );

    console.log('Found expired plans:', plans.length);
    return plans;
  }

  async markReferralRewardPaid(planId: number): Promise<MiningPlan> {
    const [updatedPlan] = await db
      .update(miningPlans)
      .set({ referralRewardPaid: true })
      .where(eq(miningPlans.id, planId))
      .returning();
    return updatedPlan;
  }

  async getReferralPlans(referralCode: string): Promise<MiningPlan[]> {
    return await db
      .select()
      .from(miningPlans)
      .where(eq(miningPlans.referralCode, referralCode));
  }

  async claimFreeCPXTB(username: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ hasClaimedFreeCPXTB: true })
      .where(eq(users.username, username))
      .returning();
    return user;
  }

  async updateLastCPXTBClaimTime(username: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ lastCPXTBClaimTime: new Date() })
      .where(eq(users.username, username))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();