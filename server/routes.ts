import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMiningPlanSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get active mining plan
  app.get("/api/mining-plan/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const plan = await storage.getActiveMiningPlan(walletAddress);
      res.json({ plan });
    } catch (error: any) {
      res.status(500).json({
        message: "Error fetching mining plan: " + error.message
      });
    }
  });

  // Create new mining plan
  app.post("/api/mining-plan", async (req, res) => {
    try {
      const planData = insertMiningPlanSchema.parse(req.body);
      const plan = await storage.createMiningPlan(planData);
      res.status(201).json({ plan });
    } catch (error: any) {
      res.status(400).json({
        message: "Error creating mining plan: " + error.message
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
      res.status(500).json({
        message: "Error verifying transaction: " + error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}