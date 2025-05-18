import { Express, Request, Response } from "express";
import { StakingService } from "./staking-service";
import { insertStakingPlanSchema, insertStakingPositionSchema } from "@shared/schema";
import { z } from "zod";

// Create a new staking service instance
const stakingService = new StakingService();

/**
 * Register staking-related routes
 */
export function registerStakingRoutes(app: Express) {
  // Middleware to ensure user is authenticated
  const ensureAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ error: "Not authenticated" });
  };

  // Get all staking plans
  app.get("/api/staking/plans", async (req, res) => {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const plans = await stakingService.getAllStakingPlans(activeOnly);
      res.json(plans);
    } catch (error: any) {
      console.error("Error fetching staking plans:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get a specific staking plan
  app.get("/api/staking/plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await stakingService.getStakingPlan(id);
      
      if (!plan) {
        return res.status(404).json({ error: "Staking plan not found" });
      }
      
      res.json(plan);
    } catch (error: any) {
      console.error("Error fetching staking plan:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new staking plan (admin only)
  app.post("/api/staking/plans", ensureAuthenticated, async (req, res) => {
    try {
      // In a real app, you would check admin status here
      // For now, we'll allow any authenticated user to create plans
      
      // Validate request body
      const validatedData = insertStakingPlanSchema.parse(req.body);
      
      // Create the plan
      const newPlan = await stakingService.createStakingPlan(validatedData);
      res.status(201).json(newPlan);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      console.error("Error creating staking plan:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update a staking plan (admin only)
  app.patch("/api/staking/plans/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate request body
      const validatedData = insertStakingPlanSchema.partial().parse(req.body);
      
      // Update the plan
      const updatedPlan = await stakingService.updateStakingPlan(id, validatedData);
      res.json(updatedPlan);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      console.error("Error updating staking plan:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle a staking plan's active status (admin only)
  app.post("/api/staking/plans/:id/toggle", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: "isActive must be a boolean" });
      }
      
      const updatedPlan = await stakingService.toggleStakingPlanStatus(id, isActive);
      res.json(updatedPlan);
    } catch (error: any) {
      console.error("Error toggling staking plan status:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new staking position
  app.post("/api/staking/positions", ensureAuthenticated, async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertStakingPositionSchema.parse({
        ...req.body,
        userId: req.user?.id // Add the user ID from the authenticated user
      });
      
      // Create the position
      const newPosition = await stakingService.createStakingPosition(validatedData);
      res.status(201).json(newPosition);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      console.error("Error creating staking position:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get active staking positions for the authenticated user
  app.get("/api/staking/positions/active", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const positions = await stakingService.getActiveStakingPositions(userId);
      res.json(positions);
    } catch (error: any) {
      console.error("Error fetching active staking positions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get completed staking positions for the authenticated user
  app.get("/api/staking/positions/completed", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const positions = await stakingService.getCompletedStakingPositions(userId);
      res.json(positions);
    } catch (error: any) {
      console.error("Error fetching completed staking positions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get a specific staking position
  app.get("/api/staking/positions/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const position = await stakingService.getStakingPosition(id);
      
      if (!position) {
        return res.status(404).json({ error: "Staking position not found" });
      }
      
      // Ensure user can only access their own positions
      if (position.userId !== req.user!.id) {
        return res.status(403).json({ error: "You do not have permission to access this staking position" });
      }
      
      res.json(position);
    } catch (error: any) {
      console.error("Error fetching staking position:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Calculate and update rewards for a staking position
  app.post("/api/staking/positions/:id/update-rewards", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const position = await stakingService.getStakingPosition(id);
      
      if (!position) {
        return res.status(404).json({ error: "Staking position not found" });
      }
      
      // Ensure user can only update their own positions
      if (position.userId !== req.user!.id) {
        return res.status(403).json({ error: "You do not have permission to update this staking position" });
      }
      
      const result = await stakingService.calculateAndUpdateRewards(id);
      res.json(result);
    } catch (error: any) {
      console.error("Error updating staking rewards:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Withdraw a staking position
  app.post("/api/staking/positions/:id/withdraw", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { transactionHash } = req.body;
      
      if (!transactionHash) {
        return res.status(400).json({ error: "Transaction hash is required" });
      }
      
      const position = await stakingService.getStakingPosition(id);
      
      if (!position) {
        return res.status(404).json({ error: "Staking position not found" });
      }
      
      // Ensure user can only withdraw their own positions
      if (position.userId !== req.user!.id) {
        return res.status(403).json({ error: "You do not have permission to withdraw this staking position" });
      }
      
      // Verify the position is ready for withdrawal
      const now = new Date();
      const endDate = new Date(position.endDate);
      
      if (endDate > now && position.isActive) {
        return res.status(400).json({
          error: "Staking position is still locked",
          endDate: endDate,
          currentDate: now,
          daysRemaining: Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        });
      }
      
      if (position.hasWithdrawn) {
        return res.status(400).json({ error: "Staking position has already been withdrawn" });
      }
      
      const updatedPosition = await stakingService.withdrawStakingPosition(id, transactionHash);
      res.json(updatedPosition);
    } catch (error: any) {
      console.error("Error withdrawing staking position:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get user staking stats
  app.get("/api/staking/stats", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get active positions
      const activePositions = await stakingService.getActiveStakingPositions(userId);
      
      // Calculate total staked
      const totalStaked = await stakingService.getUserTotalStaked(userId);
      
      // Calculate total rewards
      const totalRewards = await stakingService.getUserTotalRewards(userId);
      
      // Get total platform stake (for all users)
      const totalPlatformStake = await stakingService.getTotalStakedAmount();
      
      res.json({
        activePositionsCount: activePositions.length,
        totalStaked,
        totalRewards,
        totalPlatformStake
      });
    } catch (error: any) {
      console.error("Error fetching staking stats:", error);
      res.status(500).json({ error: error.message });
    }
  });
}