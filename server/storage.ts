import { 
  users, miningPlans, merchants, payments,
  type User, type InsertUser, 
  type MiningPlan, type InsertMiningPlan,
  type Merchant, type InsertMerchant,
  type Payment, type InsertPayment 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, sql, desc, lt, asc } from "drizzle-orm";
import crypto from "crypto";

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
  
  // Merchant methods
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  getMerchant(id: number): Promise<Merchant | undefined>;
  getMerchantByApiKey(apiKey: string): Promise<Merchant | undefined>;
  getMerchantsByUserId(userId: number): Promise<Merchant[]>;
  updateMerchant(id: number, updates: Partial<InsertMerchant>): Promise<Merchant>;
  deleteMerchant(id: number): Promise<void>;
  
  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByReference(paymentReference: string): Promise<Payment | undefined>;
  getPaymentsByMerchant(merchantId: number): Promise<Payment[]>;
  updatePaymentStatus(paymentId: number, status: string, transactionHash?: string): Promise<Payment>;
  getExpiredPayments(): Promise<Payment[]>;
  getMerchantReport(merchantId: number, startDate: Date, endDate: Date): Promise<{
    totalPayments: number;
    successfulPayments: number;
    totalAmountUsd: number;
    totalAmountCpxtb: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Try both original and normalized address
    const normalizedUsername = username.toLowerCase();
    const [user] = await db
      .select()
      .from(users)
      .where(
        sql`LOWER(${users.username}) = ${normalizedUsername}`
      );

    if (!user && username !== normalizedUsername) {
      // Try with original case if not found
      const [originalUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      return originalUser;
    }

    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Always normalize username (wallet address)
    const normalizedUsername = insertUser.username.toLowerCase();

    // Check if user exists first
    const existingUser = await this.getUserByUsername(normalizedUsername);
    if (existingUser) {
      return existingUser;
    }

    // Generate unique referral code if not provided
    if (!insertUser.referralCode) {
      insertUser.referralCode = `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    // Create new user with normalized username
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        username: normalizedUsername
      })
      .returning();

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
      .orderBy(desc(miningPlans.activatedAt)); // Order by activation time, most recent first
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
}

export const storage = new DatabaseStorage();