import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create payment intent for mining plan
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, withdrawalAddress } = req.body;

      if (!amount || !withdrawalAddress) {
        throw new Error('Missing required fields: amount or withdrawalAddress');
      }

      console.log('Creating payment intent:', {
        amount,
        withdrawalAddress,
        timestamp: new Date().toISOString()
      });

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        payment_method_types: ['card'],
        metadata: {
          type: 'mining_plan',
          withdrawal_address: withdrawalAddress
        }
      });

      console.log('Payment intent created:', {
        id: paymentIntent.id,
        status: paymentIntent.status,
        timestamp: new Date().toISOString()
      });

      res.json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (error: any) {
      console.error('Error creating payment intent:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({ 
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}