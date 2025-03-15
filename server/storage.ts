import { users, miningPlans, type User, type InsertUser, type MiningPlan, type InsertMiningPlan } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte } from "drizzle-orm";

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
    console.log('Getting referral stats for code:', referralCode);

    try {
      // Get all plans with this referral code
      const plans = await db
        .select({
          id: miningPlans.id,
          amount: miningPlans.amount,
          referralCode: miningPlans.referralCode,
          walletAddress: miningPlans.walletAddress
        })
        .from(miningPlans)
        .where(eq(miningPlans.referralCode, referralCode));

      console.log('Found plans for referral:', plans);

      // Count total referrals
      const totalReferrals = plans.length;

      // Calculate total rewards (5% of each plan amount)
      const totalRewards = plans.reduce((sum, plan) => {
        const planAmount = parseFloat(plan.amount);
        console.log(`Processing plan ${plan.id} with amount ${planAmount}`);
        return sum + (planAmount * 0.05);
      }, 0);

      const stats = {
        totalReferrals,
        totalRewards: totalRewards.toFixed(2)
      };

      console.log('Calculated referral stats:', stats);
      return stats;
    } catch (error) {
      console.error('Error calculating referral stats:', error);
      throw error;
    }
  }

  // Mining plan methods
  async createMiningPlan(plan: InsertMiningPlan): Promise<MiningPlan> {
    console.log('Creating mining plan:', plan);
    const [newPlan] = await db.insert(miningPlans).values(plan).returning();
    console.log('Created mining plan:', newPlan);
    return newPlan;
  }

  async getActiveMiningPlans(walletAddress: string): Promise<MiningPlan[]> {
    return await db
      .select()
      .from(miningPlans)
      .where(
        and(
          eq(miningPlans.walletAddress, walletAddress),
          eq(miningPlans.isActive, true),
          gte(miningPlans.expiresAt, new Date())
        )
      );
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
      .set({ hasWithdrawn: true })
      .where(eq(miningPlans.id, planId))
      .returning();
    return updatedPlan;
  }

  async getExpiredUnwithdrawnPlans(walletAddress: string): Promise<MiningPlan[]> {
    return await db
      .select()
      .from(miningPlans)
      .where(
        and(
          eq(miningPlans.walletAddress, walletAddress),
          eq(miningPlans.hasWithdrawn, false),
          gte(new Date(), miningPlans.expiresAt)
        )
      );
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
}

export const storage = new DatabaseStorage();