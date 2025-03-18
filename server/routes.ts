import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMiningPlanSchema, miningPlans } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { eq, gte, and } from 'drizzle-orm';
import { db } from './db';
import { TREASURY_ADDRESS } from './constants';

export async function registerRoutes(app: Express): Promise<Server> {
  // Get or create user
  app.get("/api/users/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const referredBy = req.query.ref as string; // Get referral code from query param
      let user = await storage.getUserByUsername(address);

      if (!user) {
        // Create new user with a referral code
        const newUserData = {
          username: address,
          password: 'not-used', // OAuth-based auth, password not used
          referralCode: `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          referredBy: referredBy // Store the referrer's code if provided
        };
        user = await storage.createUser(newUserData);
      }

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

  // Get expired, unwithdraw plans for claiming rewards
  app.get("/api/mining-plans/:walletAddress/claimable", async (req, res) => {
    try {
      const { walletAddress } = req.params;

      // Check if it's the admin wallet
      const isAdmin = walletAddress.toLowerCase() === TREASURY_ADDRESS.toLowerCase();

      let plans;
      if (isAdmin) {
        // Admin can see all expired, unwithdrawn plans
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
      // Log incoming request
      console.log('Creating mining plan with data:', req.body);

      // If referral code is provided and not null, verify it exists
      if (req.body.referralCode) {
        console.log('Verifying referral code:', req.body.referralCode);
        const referrer = await storage.getUserByReferralCode(req.body.referralCode);
        if (!referrer) {
          console.log('Invalid referral code:', req.body.referralCode);
          res.status(400).json({
            message: "Invalid referral code"
          });
          return;
        }
        console.log('Valid referral code, referrer found:', referrer.username);
      }

      // Prepare plan data with referral code
      const planData = {
        ...req.body,
        referralCode: req.body.referralCode || null
      };

      console.log('Prepared plan data:', planData);

      // Validate and create plan
      const validatedPlanData = insertMiningPlanSchema.parse(planData);
      const plan = await storage.createMiningPlan(validatedPlanData);

      console.log('Plan created successfully:', plan);
      res.status(201).json({ plan });
    } catch (error: any) {
      console.error("Error creating mining plan:", error);

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

      // Verify the referral code exists
      const referrer = await storage.getUserByReferralCode(code);
      if (!referrer) {
        console.log('Invalid referral code:', code);
        res.status(404).json({
          message: "Invalid referral code",
          totalReferrals: 0,
          totalRewards: "0.00"
        });
        return;
      }

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

  const httpServer = createServer(app);
  return httpServer;
}