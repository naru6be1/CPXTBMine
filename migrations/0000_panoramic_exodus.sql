CREATE TABLE "merchants" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"business_name" text NOT NULL,
	"wallet_address" text NOT NULL,
	"business_type" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"website" text,
	"description" text,
	"api_key" text NOT NULL,
	"logo_url" text,
	"is_verified" boolean DEFAULT false,
	"webhook_url" text,
	"legal_agreement_accepted" boolean DEFAULT false NOT NULL,
	"primary_color" text DEFAULT '#3b82f6',
	"secondary_color" text DEFAULT '#10b981',
	"accent_color" text DEFAULT '#f59e0b',
	"font_family" text DEFAULT 'Inter',
	"border_radius" integer DEFAULT 8,
	"dark_mode" boolean DEFAULT false,
	"custom_css" text,
	"custom_header" text,
	"custom_footer" text,
	"theme_template" text DEFAULT 'default',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "merchants_api_key_unique" UNIQUE("api_key")
);
--> statement-breakpoint
CREATE TABLE "mining_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"withdrawal_address" text NOT NULL,
	"plan_type" text NOT NULL,
	"amount" text NOT NULL,
	"daily_reward_cpxtb" text NOT NULL,
	"activated_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"transaction_hash" text NOT NULL,
	"has_withdrawn" boolean DEFAULT false NOT NULL,
	"referral_code" text,
	"referral_reward_paid" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"order_id" text NOT NULL,
	"amount_usd" numeric(10, 2) NOT NULL,
	"amount_cpxtb" numeric(20, 8) NOT NULL,
	"customer_wallet_address" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"transaction_hash" text,
	"payment_reference" text NOT NULL,
	"description" text,
	"callback_status" text,
	"callback_response" text,
	"exchange_rate" numeric(20, 8) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "payments_payment_reference_unique" UNIQUE("payment_reference")
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"recommendation_type" text NOT NULL,
	"content" text NOT NULL,
	"context" jsonb,
	"is_implemented" boolean DEFAULT false,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"referral_code" text NOT NULL,
	"referred_by" text,
	"last_cpxtb_claim_time" timestamp,
	"last_claim_ip" text,
	"ip_claim_time" timestamp,
	"accumulated_cpxtb" numeric(10, 3) DEFAULT '0',
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;