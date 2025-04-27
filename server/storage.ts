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
  updateMerchantTheme(id: number, themeOptions: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    borderRadius?: number;
    darkMode?: boolean;
    customCss?: string;
    customHeader?: string;
    customFooter?: string;
    themeTemplate?: string;
  }): Promise<Merchant>;
  applyThemeTemplate(id: number, templateName: string): Promise<Merchant>;
  deleteMerchant(id: number): Promise<void>;
  
  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByReference(paymentReference: string): Promise<Payment | undefined>;
  getPaymentsByMerchant(merchantId: number): Promise<Payment[]>;
  updatePaymentStatus(paymentId: number, status: string, transactionHash?: string): Promise<Payment>;
  getExpiredPayments(): Promise<Payment[]>;
  getPendingPayments(): Promise<Payment[]>;
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

    // Create new user with normalized username and convert numeric values to strings
    const insertData = {
      ...insertUser,
      username: normalizedUsername,
      // Ensure numeric fields are properly converted to strings
      accumulatedCPXTB: insertUser.accumulatedCPXTB !== undefined ? 
        insertUser.accumulatedCPXTB?.toString() : 
        "0.000"
    };

    const [user] = await db
      .insert(users)
      .values(insertData)
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
    const currentDate = new Date();
    await db
      .update(miningPlans)
      .set({ isActive: false })
      .where(
        and(
          eq(miningPlans.isActive, true),
          sql`${miningPlans.expiresAt} <= ${currentDate}`
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
          sql`${miningPlans.expiresAt} <= ${currentTime}`  // Only return truly expired plans
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
  
  // Merchant methods
  async createMerchant(merchant: InsertMerchant): Promise<Merchant> {
    // Generate a unique API key for the merchant
    const apiKey = crypto.randomBytes(32).toString('hex');
    
    // Create the merchant with the API key
    const [newMerchant] = await db
      .insert(merchants)
      .values({
        ...merchant,
        apiKey,
        updatedAt: new Date(),
      })
      .returning();
      
    return newMerchant;
  }
  
  async getMerchant(id: number): Promise<Merchant | undefined> {
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, id));
      
    return merchant;
  }
  
  async getMerchantByApiKey(apiKey: string): Promise<Merchant | undefined> {
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.apiKey, apiKey));
      
    return merchant;
  }
  
  async getMerchantsByUserId(userId: number): Promise<Merchant[]> {
    return await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, userId))
      .orderBy(desc(merchants.createdAt));
  }
  
  async updateMerchant(id: number, updates: Partial<InsertMerchant>): Promise<Merchant> {
    const [updatedMerchant] = await db
      .update(merchants)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, id))
      .returning();
      
    return updatedMerchant;
  }
  
  async updateMerchantTheme(id: number, themeOptions: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    borderRadius?: number;
    darkMode?: boolean;
    customCss?: string;
    customHeader?: string;
    customFooter?: string;
    themeTemplate?: string;
  }): Promise<Merchant> {
    const [updatedMerchant] = await db
      .update(merchants)
      .set({
        ...themeOptions,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, id))
      .returning();
    
    return updatedMerchant;
  }
  
  async applyThemeTemplate(id: number, templateName: string): Promise<Merchant> {
    console.log(`ApplyThemeTemplate called for merchant ${id} with template "${templateName}"`);
    
    // Define preset theme templates
    const themeTemplates: Record<string, {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      fontFamily: string;
      borderRadius: number;
      darkMode: boolean;
    }> = {
      default: {
        primaryColor: "#3b82f6",
        secondaryColor: "#10b981",
        accentColor: "#f59e0b",
        fontFamily: "Inter",
        borderRadius: 8,
        darkMode: false,
      },
      modern: {
        primaryColor: "#6366f1",
        secondaryColor: "#8b5cf6",
        accentColor: "#ec4899",
        fontFamily: "Montserrat",
        borderRadius: 12,
        darkMode: false,
      },
      minimal: {
        primaryColor: "#111827",
        secondaryColor: "#374151",
        accentColor: "#f43f5e",
        fontFamily: "Roboto",
        borderRadius: 4,
        darkMode: false,
      },
      bold: {
        primaryColor: "#ef4444",
        secondaryColor: "#f97316",
        accentColor: "#eab308",
        fontFamily: "Poppins",
        borderRadius: 0,
        darkMode: false,
      },
      elegant: {
        primaryColor: "#475569",
        secondaryColor: "#94a3b8",
        accentColor: "#a855f7",
        fontFamily: "Playfair Display",
        borderRadius: 16,
        darkMode: false,
      },
      tech: {
        primaryColor: "#0ea5e9",
        secondaryColor: "#22d3ee",
        accentColor: "#4ade80",
        fontFamily: "JetBrains Mono",
        borderRadius: 6,
        darkMode: true,
      },
      playful: {
        primaryColor: "#a855f7",
        secondaryColor: "#ec4899",
        accentColor: "#0ea5e9",
        fontFamily: "Comic Sans MS",
        borderRadius: 20,
        darkMode: false,
      },
    };
    
    // Get the template or use default if not found
    const template = themeTemplates[templateName] || themeTemplates.default;
    
    console.log("Using template:", {
      templateName,
      settings: template
    });
    
    // Explicitly create the update object with all needed fields
    const updateData = {
      ...template,
      themeTemplate: templateName,
      updatedAt: new Date(),
    };
    
    console.log("Database update data:", updateData);
    
    try {
      const [updatedMerchant] = await db
        .update(merchants)
        .set(updateData)
        .where(eq(merchants.id, id))
        .returning();
        
      console.log("Theme applied successfully:", {
        merchantId: id,
        themeTemplate: updatedMerchant.themeTemplate,
        primaryColor: updatedMerchant.primaryColor,
        updatedAt: updatedMerchant.updatedAt
      });
      
      return updatedMerchant;
    } catch (error) {
      console.error("Error applying theme template:", error);
      throw error;
    }
  }
  
  async deleteMerchant(id: number): Promise<void> {
    await db
      .delete(merchants)
      .where(eq(merchants.id, id));
  }
  
  // Payment methods
  async createPayment(payment: InsertPayment): Promise<Payment> {
    // Convert numeric fields to strings for compatibility with PostgreSQL
    const paymentData = {
      ...payment,
      // Ensure numeric fields are properly converted to strings
      amountUsd: typeof payment.amountUsd === 'number' ? payment.amountUsd.toString() : payment.amountUsd,
      amountCpxtb: typeof payment.amountCpxtb === 'number' ? payment.amountCpxtb.toString() : payment.amountCpxtb,
      exchangeRate: typeof payment.exchangeRate === 'number' ? payment.exchangeRate.toString() : payment.exchangeRate,
    };
    
    // Remove updatedAt from the object as it's handled by the schema default
    const { updatedAt, ...paymentDataFiltered } = paymentData as any;
    
    // Create payment with proper data types
    const [newPayment] = await db
      .insert(payments)
      .values(paymentDataFiltered)
      .returning();
      
    return newPayment;
  }
  
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
      
    return payment;
  }
  
  async getPaymentByReference(paymentReference: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.paymentReference, paymentReference));
      
    return payment;
  }
  
  async getPaymentsByMerchant(merchantId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.merchantId, merchantId))
      .orderBy(desc(payments.createdAt));
  }
  
  async updatePaymentStatus(
    paymentId: number, 
    status: string, 
    transactionHash?: string,
    receivedAmount?: number,
    requiredAmount?: number,
    remainingAmount?: string
  ): Promise<Payment> {
    const updates: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    // If payment is completed, add completion timestamp
    if (status === 'completed') {
      updates.completedAt = new Date();
    }
    
    // If transaction hash is provided, update it
    if (transactionHash) {
      updates.transactionHash = transactionHash;
    }
    
    // If received and required amounts are provided, update them with proper string conversion
    if (receivedAmount !== undefined) {
      updates.receivedAmount = typeof receivedAmount === 'number' ? 
        receivedAmount.toString() : receivedAmount;
    }
    
    if (requiredAmount !== undefined) {
      updates.requiredAmount = typeof requiredAmount === 'number' ? 
        requiredAmount.toString() : requiredAmount;
    }
    
    // If this is a partial payment, calculate and store the remaining amount
    if (status === 'partial' && receivedAmount !== undefined && requiredAmount !== undefined) {
      // If remaining amount was explicitly provided, use it
      if (remainingAmount !== undefined) {
        updates.remainingAmount = remainingAmount;
      } else {
        // Otherwise calculate it
        const remaining = Math.max(0, requiredAmount - receivedAmount).toFixed(6);
        updates.remainingAmount = remaining;
      }
      
      console.log(`Payment ${paymentId}: Setting remainingAmount to ${updates.remainingAmount}`);
    }
    
    const [updatedPayment] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, paymentId))
      .returning();
      
    return updatedPayment;
  }
  
  async getExpiredPayments(): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.status, 'pending'),
          lt(payments.expiresAt, new Date())
        )
      );
  }
  
  async getPendingPayments(): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.status, 'pending'),
          gte(payments.expiresAt, new Date())
        )
      );
  }
  
  async getMerchantReport(merchantId: number, startDate: Date, endDate: Date): Promise<{
    totalPayments: number;
    successfulPayments: number;
    totalAmountUsd: number;
    totalAmountCpxtb: string;
  }> {
    const allPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.merchantId, merchantId),
          gte(payments.createdAt, startDate),
          lt(payments.createdAt, endDate)
        )
      );
      
    const successfulPayments = allPayments.filter(p => p.status === 'completed');
    
    // Calculate totals
    const totalAmountUsd = successfulPayments.reduce((sum, p) => {
      return sum + Number(p.amountUsd);
    }, 0);
    
    const totalAmountCpxtb = successfulPayments.reduce((sum, p) => {
      return sum + Number(p.amountCpxtb);
    }, 0);
    
    return {
      totalPayments: allPayments.length,
      successfulPayments: successfulPayments.length,
      totalAmountUsd,
      totalAmountCpxtb: totalAmountCpxtb.toString()
    };
  }
  
  async getDetailedMerchantReport(merchantId: number, startDate: Date, endDate: Date): Promise<{
    summary: {
      totalPayments: number;
      successfulPayments: number;
      failedPayments: number;
      pendingPayments: number;
      expiredPayments: number;
      totalAmountUsd: number;
      totalAmountCpxtb: string;
    };
    payments: Payment[];
    dailyTotals: {
      date: string;
      count: number;
      amountUsd: number;
      amountCpxtb: string;
    }[];
  }> {
    // Get all payments in the date range
    const allPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.merchantId, merchantId),
          gte(payments.createdAt, startDate),
          lt(payments.createdAt, endDate)
        )
      )
      .orderBy(desc(payments.createdAt));
    
    // Filter payments by status
    const successfulPayments = allPayments.filter(p => p.status === 'completed');
    const failedPayments = allPayments.filter(p => p.status === 'failed');
    const pendingPayments = allPayments.filter(p => p.status === 'pending' && new Date(p.expiresAt) > new Date());
    const expiredPayments = allPayments.filter(p => p.status === 'pending' && new Date(p.expiresAt) <= new Date());
    
    // Calculate totals
    const totalAmountUsd = successfulPayments.reduce((sum, p) => sum + Number(p.amountUsd), 0);
    const totalAmountCpxtb = successfulPayments.reduce((sum, p) => sum + Number(p.amountCpxtb), 0);
    
    // Generate daily totals
    const dailyMap = new Map<string, { count: number; amountUsd: number; amountCpxtb: number }>();
    
    // Initialize days in the range to ensure all days appear in the report
    const daysBetween = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < daysBetween; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      const dateStr = day.toISOString().split('T')[0]; // YYYY-MM-DD
      dailyMap.set(dateStr, { count: 0, amountUsd: 0, amountCpxtb: 0 });
    }
    
    // Populate with actual data
    for (const payment of successfulPayments) {
      const dateStr = new Date(payment.createdAt).toISOString().split('T')[0];
      const current = dailyMap.get(dateStr) || { count: 0, amountUsd: 0, amountCpxtb: 0 };
      
      dailyMap.set(dateStr, {
        count: current.count + 1,
        amountUsd: current.amountUsd + Number(payment.amountUsd),
        amountCpxtb: current.amountCpxtb + Number(payment.amountCpxtb)
      });
    }
    
    // Convert map to array and sort by date
    const dailyTotals = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      amountUsd: data.amountUsd,
      amountCpxtb: data.amountCpxtb.toString()
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      summary: {
        totalPayments: allPayments.length,
        successfulPayments: successfulPayments.length,
        failedPayments: failedPayments.length,
        pendingPayments: pendingPayments.length,
        expiredPayments: expiredPayments.length,
        totalAmountUsd,
        totalAmountCpxtb: totalAmountCpxtb.toString()
      },
      payments: allPayments,
      dailyTotals
    };
  }
}

export const storage = new DatabaseStorage();