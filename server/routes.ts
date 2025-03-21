import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMiningPlanSchema, miningPlans } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { eq, gte, and } from 'drizzle-orm';
import { db } from './db';
import { TREASURY_ADDRESS } from './constants';

export async function registerRoutes(app: Express): Promise<Server> {
  // Update user endpoint with debug logging
  app.get("/api/users/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const referredBy = req.query.ref as string;

      console.log('Fetching user data:', { address, referredBy });

      // First check if user exists
      let user = await storage.getUserByUsername(address);

      console.log('Existing user data:', user);

      if (!user) {
        // If referral code provided, verify it exists
        if (referredBy) {
          const referrer = await storage.getUserByReferralCode(referredBy);
          if (!referrer) {
            res.status(400).json({
              message: "Invalid referral code"
            });
            return;
          }
        }

        // Create new user with referral info
        const newUserData = {
          username: address,
          password: 'not-used', // OAuth-based auth, password not used
          referralCode: `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          referredBy: referredBy,
          hasClaimedFreeCPXTB: false // Set initial value
        };

        console.log('Creating new user with data:', newUserData);
        user = await storage.createUser(newUserData);
      }

      console.log('Returning user data:', user);
      res.json({ user });
    } catch (error: any) {
      console.error("Error fetching/creating user:", error);
      res.status(500).json({
        message: "Error fetching/creating user: " + error.message
      });
    }
  });

  // Get active mining plans
  app.get("/api/mining-plans/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const plans = await storage.getActiveMiningPlans(walletAddress);
      res.json({ plans });
    } catch (error: any) {
      console.error("Error fetching mining plans:", error);
      res.status(500).json({
        message: "Error fetching mining plans: " + error.message
      });
    }
  });

  // Update the claimable plans endpoint to include free CPXTB claims
  app.get("/api/mining-plans/:walletAddress/claimable", async (req, res) => {
    try {
      const { walletAddress } = req.params;

      // Check if it's the admin wallet
      const isAdmin = walletAddress.toLowerCase() === TREASURY_ADDRESS.toLowerCase();

      let plans;
      if (isAdmin) {
        // Admin can see all expired, unwithdrawn plans including free CPXTB claims
        plans = await db
          .select()
          .from(miningPlans)
          .where(
            and(
              eq(miningPlans.hasWithdrawn, false),
              eq(miningPlans.isActive, true)
            )
          );
      } else {
        // Regular users can only see their own expired plans
        plans = await storage.getExpiredUnwithdrawnPlans(walletAddress);
      }

      res.json({ plans, isAdmin });
    } catch (error: any) {
      console.error("Error fetching claimable plans:", error);
      res.status(500).json({
        message: "Error fetching claimable plans: " + error.message
      });
    }
  });

  // Create new mining plan
  app.post("/api/mining-plans", async (req, res) => {
    try {
      // If referral code is provided, verify it exists
      if (req.body.referralCode) {
        const referrer = await storage.getUserByReferralCode(req.body.referralCode);
        if (!referrer) {
          res.status(400).json({
            message: "Invalid referral code"
          });
          return;
        }
      }

      // Log the incoming request
      console.log('Creating mining plan with referral:', {
        referralCode: req.body.referralCode,
        walletAddress: req.body.walletAddress
      });

      // Validate plan data against schema
      const planData = insertMiningPlanSchema.parse(req.body);

      const plan = await storage.createMiningPlan(planData);
      res.status(201).json({ plan });
    } catch (error: any) {
      console.error("Error creating mining plan:", error);

      // Enhanced error handling for validation errors
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({
          message: "Invalid mining plan data: " + validationError.message
        });
        return;
      }

      res.status(400).json({
        message: "Error creating mining plan: " + error.message
      });
    }
  });

  // Mark plan as withdrawn after successful claim
  app.post("/api/mining-plans/:planId/withdraw", async (req, res) => {
    try {
      const { planId } = req.params;
      const { transactionHash } = req.body;

      if (!transactionHash) {
        res.status(400).json({
          message: "Transaction hash is required"
        });
        return;
      }

      const updatedPlan = await storage.markPlanAsWithdrawn(parseInt(planId));
      res.json({ plan: updatedPlan });
    } catch (error: any) {
      console.error("Error marking plan as withdrawn:", error);
      res.status(500).json({
        message: "Error marking plan as withdrawn: " + error.message
      });
    }
  });

  // Verify transaction hash
  app.get("/api/mining-plans/verify/:hash", async (req, res) => {
    try {
      const { hash } = req.params;
      const plan = await storage.getMiningPlanByHash(hash);
      res.json({ plan });
    } catch (error: any) {
      console.error("Error verifying transaction:", error);
      res.status(500).json({
        message: "Error verifying transaction: " + error.message
      });
    }
  });

  // Get referral stats
  app.get("/api/referrals/:code/stats", async (req, res) => {
    try {
      const { code } = req.params;
      console.log('Fetching referral stats for code:', code);
      const stats = await storage.getReferralStats(code);
      console.log('Referral stats result:', stats);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({
        message: "Error fetching referral stats: " + error.message
      });
    }
  });

  // Get referral plans
  app.get("/api/referrals/:code/plans", async (req, res) => {
    try {
      const { code } = req.params;
      const plans = await storage.getReferralPlans(code);
      res.json({ plans });
    } catch (error: any) {
      console.error("Error fetching referral plans:", error);
      res.status(500).json({
        message: "Error fetching referral plans: " + error.message
      });
    }
  });

  // Add this new endpoint in the registerRoutes function
  app.post("/api/users/:address/claim-free-cpxtb", async (req, res) => {
    try {
      const { address } = req.params;
      const { withdrawalAddress } = req.body;

      if (!withdrawalAddress) {
        res.status(400).json({
          message: "Withdrawal address is required"
        });
        return;
      }

      // Get user and check if they've already claimed
      const user = await storage.getUserByUsername(address);
      if (!user) {
        res.status(404).json({
          message: "User not found"
        });
        return;
      }

      if (user.hasClaimedFreeCPXTB) {
        res.status(400).json({
          message: "Free CPXTB has already been claimed"
        });
        return;
      }

      // Update user to mark as claimed
      const updatedUser = await storage.claimFreeCPXTB(address);

      // Create a special mining plan for the free CPXTB
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

      const plan = await storage.createMiningPlan({
        walletAddress: address,
        withdrawalAddress,
        planType: 'daily',
        amount: '0', // Free plan
        dailyRewardCPXTB: '10', // 10 CPXTB
        activatedAt: now, // Pass Date object directly
        expiresAt: expiresAt, // Pass Date object directly
        transactionHash: 'FREE_CPXTB_CLAIM',
        referralCode: null
      });

      res.json({ user: updatedUser, plan });
    } catch (error: any) {
      console.error("Error claiming free CPXTB:", error);
      res.status(500).json({
        message: "Error claiming free CPXTB: " + error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}