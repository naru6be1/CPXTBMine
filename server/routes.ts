import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  users, merchants, payments,
  insertMerchantSchema, insertPaymentSchema 
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { eq, gte, and, sql, lte } from "drizzle-orm";
import { db, checkDatabaseConnection } from "./db";
import { z } from "zod";
import crypto from "crypto";
import { TREASURY_ADDRESS, CPXTB_TOKEN_ADDRESS, BASE_CHAIN_ID } from "./constants";
import { promisify } from "util";
import { checkPayPalStatus, createTokenPurchaseOrder, capturePayPalPayment, processTokenPurchase } from "./paypal-service";
import { WebSocketServer, WebSocket } from "ws";
import { createPublicClient, http, parseAbi, parseAbiItem, formatUnits } from "viem";
import { base } from "wagmi/chains";
import { createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { startPaymentMonitoring } from "./transaction-listener";
import { registerTestChallengeRoutes } from "./test-challenge-route";
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import session from 'express-session';
import { setupGoogleAuth, registerGoogleAuthRoutes } from './google-auth';

// Password hashing and comparison functions
const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return crypto.timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

// Add type declarations for session data
declare module 'express-session' {
  interface SessionData {
    redirectUrl?: string;
    paymentContext?: boolean;
    paymentReference?: string;
    user?: any;
    isAuthenticated?: boolean;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up Express session
  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  });

  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  // Check database connection
  const dbConnected = await checkDatabaseConnection();
  console.log("Database connection status:", dbConnected ? "Connected" : "Not connected");

  // Set up Google OAuth
  setupGoogleAuth();
  
  // Register Google OAuth routes
  registerGoogleAuthRoutes(app);

  // API status endpoint
  app.get("/api/status", (req: Request, res: Response) => {
    const userAuthenticated = req.isAuthenticated();
    const dbStatus = dbConnected ? "connected" : "disconnected";
    
    res.json({
      status: "online",
      authenticated: userAuthenticated,
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  });

  // Return database info endpoint
  app.get("/api/db-info", async (req: Request, res: Response) => {
    try {
      // Check database connection
      const connected = await checkDatabaseConnection();
      
      if (!connected) {
        return res.status(500).json({ error: "Database not connected" });
      }
      
      // Get counts
      const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
      const merchantCount = await db.select({ count: sql<number>`count(*)` }).from(merchants);
      const paymentCount = await db.select({ count: sql<number>`count(*)` }).from(payments);
      
      res.json({
        connected: true,
        counts: {
          users: userCount[0]?.count || 0,
          merchants: merchantCount[0]?.count || 0,
          payments: paymentCount[0]?.count || 0
        }
      });
    } catch (error) {
      console.error("Error getting DB info:", error);
      res.status(500).json({ error: "Failed to get database information" });
    }
  });

  // Register merchant API
  app.post("/api/merchants", async (req: Request, res: Response) => {
    try {
      const parsedBody = insertMerchantSchema.safeParse(req.body);
      
      if (!parsedBody.success) {
        const errorMessage = fromZodError(parsedBody.error).message;
        return res.status(400).json({ error: errorMessage });
      }
      
      // Check if merchant already exists
      const existingMerchant = await storage.getMerchantByEmail(parsedBody.data.email);
      
      if (existingMerchant) {
        return res.status(409).json({ error: "Merchant with this email already exists" });
      }
      
      // Hash password
      parsedBody.data.password = await hashPassword(parsedBody.data.password);
      
      // Create merchant
      const merchant = await storage.createMerchant(parsedBody.data);
      
      // Remove password from response
      const { password, ...merchantWithoutPassword } = merchant;
      
      res.status(201).json(merchantWithoutPassword);
    } catch (error) {
      console.error("Error creating merchant:", error);
      res.status(500).json({ error: "Failed to create merchant" });
    }
  });

  // Merchant login API
  app.post("/api/merchants/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      // Find merchant
      const merchant = await storage.getMerchantByEmail(email);
      
      if (!merchant) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Compare passwords
      const passwordMatch = await comparePasswords(password, merchant.password);
      
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Remove password from response
      const { password: _, ...merchantWithoutPassword } = merchant;
      
      // Set session
      req.session.user = merchantWithoutPassword;
      req.session.isAuthenticated = true;
      
      res.json(merchantWithoutPassword);
    } catch (error) {
      console.error("Error during merchant login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Create payment API
  app.post("/api/payments", async (req: Request, res: Response) => {
    try {
      const parsedBody = insertPaymentSchema.safeParse(req.body);
      
      if (!parsedBody.success) {
        const errorMessage = fromZodError(parsedBody.error).message;
        return res.status(400).json({ error: errorMessage });
      }
      
      // Create payment
      const payment = await storage.createPayment(parsedBody.data);
      
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  // Get payment by reference
  app.get("/api/payments/:reference", async (req: Request, res: Response) => {
    try {
      const { reference } = req.params;
      
      if (!reference) {
        return res.status(400).json({ error: "Payment reference is required" });
      }
      
      // Find payment
      const payment = await storage.getPaymentByReference(reference);
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      res.json(payment);
    } catch (error) {
      console.error("Error getting payment:", error);
      res.status(500).json({ error: "Failed to get payment" });
    }
  });

  // PayPal endpoints
  app.post("/api/paypal/status", checkPayPalStatus);
  app.post("/api/paypal/create-order", createTokenPurchaseOrder);
  app.post("/api/paypal/capture-payment", capturePayPalPayment);
  app.post("/api/paypal/process-token-purchase", processTokenPurchase);

  // Create HTTP server
  const server = createServer(app);

  // WebSocket server for real-time payment updates
  const wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'subscribe' && data.paymentReference) {
          console.log(`Client subscribed to payment updates for: ${data.paymentReference}`);
          (ws as any).paymentReference = data.paymentReference;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Function to broadcast payment updates
  const broadcastPaymentUpdate = (paymentReference: string, status: string, txHash?: string) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && (client as any).paymentReference === paymentReference) {
        client.send(JSON.stringify({
          type: 'payment_update',
          paymentReference,
          status,
          txHash
        }));
      }
    });
  };

  // Start payment monitoring
  await startPaymentMonitoring(broadcastPaymentUpdate);

  return server;
}