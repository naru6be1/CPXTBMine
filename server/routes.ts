import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMiningPlanSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { eq, and } from 'drizzle-orm';
import { db } from './db';
import { TREASURY_ADDRESS } from './constants';

export async function registerRoutes(app: Express): Promise<Server> {
  // Get or create user
  app.get("/api/users/:address", async (req, res) => {
    try {
      const { address } = req.params;
      let user = await storage.getUserByUsername(address);

      if (!user) {
        // Create new user
        const newUserData = {
          username: address,
          password: 'not-used', // OAuth-based auth, password not used
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

  // Get claimable plans
  app.get("/api/mining-plans/:walletAddress/claimable", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const isAdmin = walletAddress.toLowerCase() === TREASURY_ADDRESS.toLowerCase();

      let plans;
      if (isAdmin) {
        // Admin can see all expired, unwithdrawn plans
        plans = await storage.getAllExpiredUnwithdrawnPlans();
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
      // Validate and create plan
      const validatedPlanData = insertMiningPlanSchema.parse(req.body);
      const plan = await storage.createMiningPlan(validatedPlanData);
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

  // Mark plan as withdrawn
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

  const httpServer = createServer(app);
  return httpServer;
}