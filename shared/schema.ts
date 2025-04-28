import { pgTable, text, serial, integer, boolean, timestamp, real, numeric, varchar, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  lastCPXTBClaimTime: timestamp("last_cpxtb_claim_time"),
  lastClaimIp: text("last_claim_ip"),
  ipClaimTime: timestamp("ip_claim_time"),
  accumulatedCPXTB: numeric("accumulated_cpxtb", { precision: 10, scale: 3 }).default("0"), // Changed to numeric for better precision
});

export const miningPlans = pgTable("mining_plans", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  withdrawalAddress: text("withdrawal_address").notNull(),
  planType: text("plan_type").notNull(),
  amount: text("amount").notNull(),
  dailyRewardCPXTB: text("daily_reward_cpxtb").notNull(),
  activatedAt: timestamp("activated_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  transactionHash: text("transaction_hash").notNull(),
  hasWithdrawn: boolean("has_withdrawn").notNull().default(false),
  referralCode: text("referral_code"),
  referralRewardPaid: boolean("referral_reward_paid").default(false),
});

export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  recommendation_type: text("recommendation_type").notNull(),
  content: text("content").notNull(),
  context: jsonb("context"),
  is_implemented: boolean("is_implemented").default(false),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Update user schema
export const insertUserSchema = createInsertSchema(users)
  .extend({
    username: z.string(),
    password: z.string(),
    referralCode: z.string(),
    referredBy: z.string().optional(),
    lastCPXTBClaimTime: z.date().nullable().optional(),
    lastClaimIp: z.string().nullable().optional(),
    ipClaimTime: z.date().nullable().optional(),
    accumulatedCPXTB: z.number().default(0), 
  });

export const insertMiningPlanSchema = createInsertSchema(miningPlans)
  .omit({ 
    id: true,
    isActive: true,
    hasWithdrawn: true,
    referralRewardPaid: true,
    createdAt: true
  })
  .extend({
    amount: z.string(),
    planType: z.enum(['bronze', 'silver', 'gold']), 
    activatedAt: z.union([z.date(), z.string()]).transform(val => 
      val instanceof Date ? val : new Date(val)
    ),
    expiresAt: z.union([z.date(), z.string()]).transform(val => 
      val instanceof Date ? val : new Date(val)
    ),
    referralCode: z.string().nullable().optional(),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMiningPlan = z.infer<typeof insertMiningPlanSchema>;
export type MiningPlan = typeof miningPlans.$inferSelect;

export const insertRecommendationSchema = createInsertSchema(recommendations)
  .omit({
    id: true,
    created_at: true,
    is_implemented: true,
    is_read: true,
  })
  .extend({
    user_id: z.number().int().positive(),
    recommendation_type: z.string(),
    content: z.string(),
    context: z.record(z.any()).optional(),
  });

export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendations.$inferSelect;

// Merchant tables for CPXTB payment processing
export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  businessName: text("business_name").notNull(),
  walletAddress: text("wallet_address").notNull(),
  businessType: text("business_type").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  website: text("website"),
  description: text("description"),
  apiKey: text("api_key").notNull().unique(),
  logoUrl: text("logo_url"),
  isVerified: boolean("is_verified").default(false),
  webhookUrl: text("webhook_url"),
  // Legal agreement
  legalAgreementAccepted: boolean("legal_agreement_accepted").default(false).notNull(),
  // Theme customization options
  primaryColor: text("primary_color").default("#3b82f6"), // Default blue
  secondaryColor: text("secondary_color").default("#10b981"), // Default green
  accentColor: text("accent_color").default("#f59e0b"), // Default amber
  fontFamily: text("font_family").default("Inter"),
  borderRadius: integer("border_radius").default(8),
  darkMode: boolean("dark_mode").default(false),
  customCss: text("custom_css"),
  customHeader: text("custom_header"),
  customFooter: text("custom_footer"),
  // Theme templates
  themeTemplate: text("theme_template").default("default"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id),
  orderId: text("order_id"), // Made optional as per user request
  amountUsd: numeric("amount_usd", { precision: 10, scale: 2 }).notNull(),
  amountCpxtb: numeric("amount_cpxtb", { precision: 20, scale: 8 }).notNull(),
  customerWalletAddress: text("customer_wallet_address"),
  status: text("status").notNull().default("pending"),
  transactionHash: text("transaction_hash"),
  paymentReference: text("payment_reference").notNull().unique(),
  description: text("description"),
  callbackStatus: text("callback_status"),
  callbackResponse: text("callback_response"),
  exchangeRate: numeric("exchange_rate", { precision: 20, scale: 8 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  completedAt: timestamp("completed_at"),
  receivedAmount: numeric("received_amount", { precision: 20, scale: 8 }),
  requiredAmount: numeric("required_amount", { precision: 20, scale: 8 }),
  remainingAmount: numeric("remaining_amount", { precision: 20, scale: 8 }),
  // Enhanced security fields
  securityStatus: text("security_status").default("unknown"),
  securityVerifiedAt: timestamp("security_verified_at"),
  metadata: text("metadata"), // JSON storage for validation results and security checks
});

// Define relations
export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  user: one(users, {
    fields: [merchants.userId],
    references: [users.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  merchant: one(merchants, {
    fields: [payments.merchantId],
    references: [merchants.id],
  }),
}));

// Create insert schemas
export const insertMerchantSchema = createInsertSchema(merchants)
  .omit({
    id: true,
    isVerified: true,
    apiKey: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    businessName: z.string().min(2),
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address"),
    businessType: z.string(),
    contactEmail: z.string().email(),
    contactPhone: z.string().optional(),
    website: z.union([z.string().url(), z.literal("")]).optional(),
    description: z.string().optional(),
    logoUrl: z.string().url().optional(),
    webhookUrl: z.string().url().optional(),
    // Legal agreement validation
    legalAgreementAccepted: z.boolean().refine(val => val === true, {
      message: "You must accept the legal agreement to register as a merchant"
    }),
    // Theme customization options
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color").optional(),
    secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color").optional(),
    accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color").optional(),
    fontFamily: z.string().optional(),
    borderRadius: z.number().int().min(0).max(24).optional(),
    darkMode: z.boolean().optional(),
    customCss: z.string().optional(),
    customHeader: z.string().optional(),
    customFooter: z.string().optional(),
    themeTemplate: z.enum(["default", "modern", "minimal", "bold", "elegant", "tech", "playful"]).optional(),
  });

export const insertPaymentSchema = createInsertSchema(payments)
  .omit({
    id: true,
    status: true,
    transactionHash: true,
    callbackStatus: true,
    callbackResponse: true,
    createdAt: true,
    updatedAt: true,
    completedAt: true,
  })
  .extend({
    orderId: z.string().optional(), // Made optional as per user request
    amountUsd: z.number().positive(),
    amountCpxtb: z.number().positive(),
    customerWalletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address").optional(),
    paymentReference: z.string(),
    description: z.string().optional(),
    exchangeRate: z.number().positive(),
    expiresAt: z.union([z.date(), z.string()]).transform(val => 
      val instanceof Date ? val : new Date(val)
    ),
  });

export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type Merchant = typeof merchants.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;