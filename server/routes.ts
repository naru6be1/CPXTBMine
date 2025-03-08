import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create payment intent for mining plan
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount } = req.body;

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        payment_method_types: ['card'],
        metadata: {
          type: 'mining_plan',
          withdrawal_address: req.body.withdrawalAddress
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ 
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}