import { db } from "./db";
import { 
  users, stakingPlans, stakingPositions,
  type StakingPlan, type InsertStakingPlan,
  type StakingPosition, type InsertStakingPosition
} from "@shared/schema";
import { eq, and, gte, lt, sql, desc, sum } from "drizzle-orm";

/**
 * Service for managing staking functionality
 */
export class StakingService {
  /**
   * Get all staking plans, with option to filter for active only
   */
  async getAllStakingPlans(activeOnly: boolean = false): Promise<StakingPlan[]> {
    let query = db.select().from(stakingPlans);
    
    if (activeOnly) {
      query = query.where(eq(stakingPlans.isActive, true));
    }
    
    return await query.orderBy(stakingPlans.minAmount);
  }

  /**
   * Get a specific staking plan by ID
   */
  async getStakingPlan(id: number): Promise<StakingPlan | undefined> {
    const [plan] = await db
      .select()
      .from(stakingPlans)
      .where(eq(stakingPlans.id, id));
    
    return plan;
  }

  /**
   * Create a new staking plan
   */
  async createStakingPlan(plan: InsertStakingPlan): Promise<StakingPlan> {
    const [newPlan] = await db
      .insert(stakingPlans)
      .values({
        ...plan,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newPlan;
  }

  /**
   * Update an existing staking plan
   */
  async updateStakingPlan(id: number, updates: Partial<InsertStakingPlan>): Promise<StakingPlan> {
    const [updatedPlan] = await db
      .update(stakingPlans)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(stakingPlans.id, id))
      .returning();
    
    return updatedPlan;
  }

  /**
   * Toggle a staking plan's active status
   */
  async toggleStakingPlanStatus(id: number, isActive: boolean): Promise<StakingPlan> {
    const [updatedPlan] = await db
      .update(stakingPlans)
      .set({
        isActive,
        updatedAt: new Date()
      })
      .where(eq(stakingPlans.id, id))
      .returning();
    
    return updatedPlan;
  }

  /**
   * Create a new staking position
   */
  async createStakingPosition(position: InsertStakingPosition): Promise<StakingPosition> {
    // Get the staking plan to validate and set end date
    const plan = await this.getStakingPlan(position.stakingPlanId);
    if (!plan) {
      throw new Error(`Staking plan with ID ${position.stakingPlanId} not found`);
    }
    
    // Calculate end date based on lock period
    const startDate = new Date(position.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.lockPeriodDays);
    
    const [newPosition] = await db
      .insert(stakingPositions)
      .values({
        ...position,
        endDate: endDate,
        isActive: true,
        rewardsEarned: "0",
        hasWithdrawn: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newPosition;
  }

  /**
   * Get a specific staking position
   */
  async getStakingPosition(id: number): Promise<StakingPosition | undefined> {
    const [position] = await db
      .select()
      .from(stakingPositions)
      .where(eq(stakingPositions.id, id));
    
    return position;
  }

  /**
   * Get a staking position by transaction hash
   */
  async getStakingPositionByTransactionHash(txHash: string): Promise<StakingPosition | undefined> {
    const [position] = await db
      .select()
      .from(stakingPositions)
      .where(eq(stakingPositions.transactionHash, txHash));
    
    return position;
  }

  /**
   * Get all active staking positions for a user
   */
  async getActiveStakingPositions(userId: number): Promise<StakingPosition[]> {
    return await db
      .select()
      .from(stakingPositions)
      .where(
        and(
          eq(stakingPositions.userId, userId),
          eq(stakingPositions.isActive, true),
          eq(stakingPositions.hasWithdrawn, false)
        )
      )
      .orderBy(stakingPositions.endDate);
  }

  /**
   * Get all active staking positions for a wallet address
   */
  async getActiveStakingPositionsForWallet(walletAddress: string): Promise<StakingPosition[]> {
    const normalizedAddress = walletAddress.toLowerCase();
    
    return await db
      .select()
      .from(stakingPositions)
      .where(
        and(
          sql`LOWER(${stakingPositions.walletAddress}) = ${normalizedAddress}`,
          eq(stakingPositions.isActive, true),
          eq(stakingPositions.hasWithdrawn, false)
        )
      )
      .orderBy(stakingPositions.endDate);
  }

  /**
   * Calculate and update rewards for a staking position
   */
  async calculateAndUpdateRewards(positionId: number): Promise<{ position: StakingPosition, rewardsAdded: number }> {
    // Get the staking position
    const position = await this.getStakingPosition(positionId);
    if (!position) {
      throw new Error(`Staking position with ID ${positionId} not found`);
    }
    
    // Get the staking plan
    const plan = await this.getStakingPlan(position.stakingPlanId);
    if (!plan) {
      throw new Error(`Staking plan with ID ${position.stakingPlanId} not found`);
    }
    
    // Calculate time since last reward calculation in days
    const now = new Date();
    const lastCalculation = new Date(position.lastRewardCalculation);
    const timeDiffMs = now.getTime() - lastCalculation.getTime();
    const daysPassed = timeDiffMs / (1000 * 60 * 60 * 24);
    
    // Only calculate rewards if at least one hour has passed
    if (daysPassed < 0.042) { // 0.042 days = 1 hour
      return { position, rewardsAdded: 0 };
    }
    
    // Calculate rewards
    const dailyRewardRate = Number(plan.aprPercentage) / 36500; // Daily rate = APR / 365 / 100
    const amountStaked = Number(position.amountStaked);
    const rewardsForPeriod = amountStaked * dailyRewardRate * daysPassed;
    
    // Round to 8 decimal places
    const formattedRewards = parseFloat(rewardsForPeriod.toFixed(8));
    
    // Add to existing rewards
    const currentRewards = Number(position.rewardsEarned);
    const newTotalRewards = currentRewards + formattedRewards;
    
    // Update the staking position
    const [updatedPosition] = await db
      .update(stakingPositions)
      .set({
        rewardsEarned: newTotalRewards.toString(),
        lastRewardCalculation: now,
        updatedAt: now
      })
      .where(eq(stakingPositions.id, position.id))
      .returning();
    
    return { 
      position: updatedPosition, 
      rewardsAdded: formattedRewards 
    };
  }

  /**
   * Mark a staking position as withdrawn
   */
  async withdrawStakingPosition(id: number, withdrawalTxHash: string): Promise<StakingPosition> {
    const [updatedPosition] = await db
      .update(stakingPositions)
      .set({
        hasWithdrawn: true,
        isActive: false,
        withdrawalTransactionHash: withdrawalTxHash,
        updatedAt: new Date()
      })
      .where(eq(stakingPositions.id, id))
      .returning();
    
    return updatedPosition;
  }

  /**
   * Get completed (withdrawn or expired) staking positions for a user
   */
  async getCompletedStakingPositions(userId: number): Promise<StakingPosition[]> {
    return await db
      .select()
      .from(stakingPositions)
      .where(
        and(
          eq(stakingPositions.userId, userId),
          or(
            eq(stakingPositions.hasWithdrawn, true),
            lt(stakingPositions.endDate, new Date())
          )
        )
      )
      .orderBy(desc(stakingPositions.endDate));
  }

  /**
   * Deactivate expired staking positions
   */
  async deactivateExpiredStakingPositions(): Promise<number> {
    const now = new Date();
    const result = await db
      .update(stakingPositions)
      .set({
        isActive: false,
        updatedAt: now
      })
      .where(
        and(
          eq(stakingPositions.isActive, true),
          lt(stakingPositions.endDate, now),
          eq(stakingPositions.hasWithdrawn, false)
        )
      )
      .returning();
    
    return result.length;
  }

  /**
   * Get total amount staked across all positions
   */
  async getTotalStakedAmount(): Promise<string> {
    const result = await db
      .select({
        total: sql`SUM(${stakingPositions.amountStaked})`
      })
      .from(stakingPositions)
      .where(
        and(
          eq(stakingPositions.isActive, true),
          eq(stakingPositions.hasWithdrawn, false)
        )
      );
    
    return result[0]?.total?.toString() || "0";
  }

  /**
   * Get total amount staked by a user
   */
  async getUserTotalStaked(userId: number): Promise<string> {
    const result = await db
      .select({
        total: sql`SUM(${stakingPositions.amountStaked})`
      })
      .from(stakingPositions)
      .where(
        and(
          eq(stakingPositions.userId, userId),
          eq(stakingPositions.isActive, true),
          eq(stakingPositions.hasWithdrawn, false)
        )
      );
    
    return result[0]?.total?.toString() || "0";
  }

  /**
   * Get total rewards earned by a user
   */
  async getUserTotalRewards(userId: number): Promise<string> {
    const result = await db
      .select({
        total: sql`SUM(${stakingPositions.rewardsEarned})`
      })
      .from(stakingPositions)
      .where(eq(stakingPositions.userId, userId));
    
    return result[0]?.total?.toString() || "0";
  }
}