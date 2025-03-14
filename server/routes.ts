import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMiningPlanSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get or create user
  app.get("/api/users/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const referredBy = req.query.ref as string; // Get referral code from query param
      console.log(`Fetching/creating user for address: ${address}, referred by: ${referredBy}`);

      let user = await storage.getUserByUsername(address);

      if (!user) {
        // Create new user with a referral code
        const newUserData = {
          username: address,
          password: 'not-used', // OAuth-based auth, password not used
          referralCode: `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          referredBy: referredBy // Store the referrer's code if provided
        };
        console.log('Creating new user with data:', newUserData);
        user = await storage.createUser(newUserData);
        console.log('Created new user:', user);
      } else {
        console.log('Found existing user:', user);
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
      console.log('Active plans:', plans);
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
      const plans = await storage.getExpiredUnwithdrawnPlans(walletAddress);
      console.log('Claimable plans:', plans);
      res.json({ plans });
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
      console.log("Received mining plan data:", JSON.stringify(req.body, null, 2));

      // If referral code is provided, verify it exists
      if (req.body.referralCode) {
        console.log("Verifying referral code:", req.body.referralCode);
        const referrer = await storage.getUserByReferralCode(req.body.referralCode);
        if (!referrer) {
          console.log("Invalid referral code:", req.body.referralCode);
          res.status(400).json({
            message: "Invalid referral code"
          });
          return;
        }
        console.log("Valid referral code found for referrer:", referrer);
      }

      // Validate plan data against schema
      const planData = insertMiningPlanSchema.parse(req.body);
      console.log("Validated plan data:", JSON.stringify(planData, null, 2));

      const plan = await storage.createMiningPlan(planData);
      console.log("Created mining plan:", JSON.stringify(plan, null, 2));

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
      console.log("Fetching referral stats for code:", code);

      // Verify the referral code exists
      const referrer = await storage.getUserByReferralCode(code);
      if (!referrer) {
        console.log("Invalid referral code for stats:", code);
        res.status(404).json({
          message: "Invalid referral code"
        });
        return;
      }
      console.log("Found referrer for stats:", referrer);

      const stats = await storage.getReferralStats(code);
      console.log("Calculated referral stats:", stats);
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
      console.log("Fetching referral plans for code:", code);
      const plans = await storage.getReferralPlans(code);
      console.log("Found referral plans:", plans);
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