import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMiningPlanSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get active mining plan
  app.get("/api/mining-plan/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const plan = await storage.getActiveMiningPlan(walletAddress);
      res.json({ plan });
    } catch (error: any) {
      console.error("Error fetching mining plan:", error);
      res.status(500).json({
        message: "Error fetching mining plan: " + error.message
      });
    }
  });

  // Get expired, unwithdraw plan for claiming rewards
  app.get("/api/mining-plan/:walletAddress/claimable", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const plan = await storage.getExpiredUnwithdrawnPlan(walletAddress);
      res.json({ plan });
    } catch (error: any) {
      console.error("Error fetching claimable plan:", error);
      res.status(500).json({
        message: "Error fetching claimable plan: " + error.message
      });
    }
  });

  // Create new mining plan
  app.post("/api/mining-plan", async (req, res) => {
    try {
      console.log("Received mining plan data:", JSON.stringify(req.body));

      // Validate plan data against schema
      const planData = insertMiningPlanSchema.parse(req.body);
      console.log("Validated plan data:", JSON.stringify(planData));

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
  app.post("/api/mining-plan/:planId/withdraw", async (req, res) => {
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
  app.get("/api/mining-plan/verify/:hash", async (req, res) => {
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