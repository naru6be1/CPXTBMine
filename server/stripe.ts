import Stripe from 'stripe';
import { Request, Response } from 'express';
import { storage } from './storage';
import { User } from '@shared/schema';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Define the discount percentage
const DISCOUNT_PERCENT = 10;

// Regular prices (in cents for Stripe)
const REGULAR_PRICES = {
  bronze: 2500, // $25.00
  silver: 5000, // $50.00
  gold: 10000,  // $100.00
};

// Calculate discounted prices
const DISCOUNTED_PRICES = {
  bronze: Math.round(REGULAR_PRICES.bronze * (100 - DISCOUNT_PERCENT) / 100),
  silver: Math.round(REGULAR_PRICES.silver * (100 - DISCOUNT_PERCENT) / 100),
  gold: Math.round(REGULAR_PRICES.gold * (100 - DISCOUNT_PERCENT) / 100),
};

// Map plan types to human-readable names
const PLAN_NAMES = {
  bronze: 'Bronze Mining Plan',
  silver: 'Silver Mining Plan',
  gold: 'Gold Mining Plan',
};

export async function createCheckoutSession(req: Request, res: Response) {
  try {
    const { planType, walletAddress, referralCode, applyDiscount } = req.body;
    
    if (!planType || !['bronze', 'silver', 'gold'].includes(planType)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // Get user to check if eligible for discount
    let user = null;
    let eligibleForDiscount = false;
    
    if (applyDiscount && req.user) {
      user = await storage.getUser(req.user.id);
      // Explicitly ensure boolean type
      eligibleForDiscount = Boolean(user && user.hasUsedDiscount === false);
    }
    
    // Determine price based on discount eligibility
    const priceInCents = eligibleForDiscount 
      ? DISCOUNTED_PRICES[planType as keyof typeof DISCOUNTED_PRICES]
      : REGULAR_PRICES[planType as keyof typeof REGULAR_PRICES];
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: PLAN_NAMES[planType as keyof typeof PLAN_NAMES],
              description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} tier CPXTB mining plan${eligibleForDiscount ? ' (10% new user discount applied)' : ''}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        planType,
        walletAddress,
        referralCode: referralCode || '',
        applyDiscount: eligibleForDiscount ? 'true' : 'false',
        userId: user ? user.id.toString() : '',
      },
      mode: 'payment',
      success_url: `${req.headers.origin}/mining?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.origin}/mining?canceled=true`,
    });
    
    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}

export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret as string
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      // Process the order
      await handleSuccessfulPayment(session);
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({ error: 'Failed to process payment' });
    }
  } else {
    res.status(200).json({ received: true });
  }
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const { planType, walletAddress, referralCode, applyDiscount, userId } = session.metadata || {};
  
  if (!planType || !walletAddress) {
    throw new Error('Missing required metadata');
  }
  
  // If discount was applied, mark it as used
  if (applyDiscount === 'true' && userId) {
    await storage.markDiscountAsUsed(parseInt(userId));
  }
  
  // Calculate plan duration and rewards based on plan type
  let durationDays = 30;
  let dailyReward = "0.5";
  
  switch (planType) {
    case 'bronze':
      durationDays = 30;
      dailyReward = "0.5";
      break;
    case 'silver':
      durationDays = 30;
      dailyReward = "1.2";
      break;
    case 'gold':
      durationDays = 30;
      dailyReward = "2.5";
      break;
  }
  
  // Calculate activation and expiration dates
  const activatedAt = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);
  
  // Create mining plan in the database
  await storage.createMiningPlan({
    walletAddress,
    withdrawalAddress: walletAddress, // Same as wallet address
    planType: planType as 'bronze' | 'silver' | 'gold',
    amount: session.amount_total ? (session.amount_total / 100).toString() : "0",
    dailyRewardCPXTB: dailyReward,
    activatedAt,
    expiresAt,
    transactionHash: session.id, // Use Stripe session ID as transaction hash
    referralCode: referralCode || null,
  });
  
  return true;
}