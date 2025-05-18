import { sql } from "drizzle-orm";
import { db } from "../server/db";

/**
 * Migration to add staking tables for token staking rewards
 */
export async function createStakingTables() {
  try {
    console.log("Starting staking tables migration...");

    // Create staking_plans table
    await sql`
      CREATE TABLE IF NOT EXISTS staking_plans (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        min_amount NUMERIC(20, 8) NOT NULL,
        lock_period_days INTEGER NOT NULL,
        apr_percentage NUMERIC(5, 2) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `.execute(db);
    console.log("Created staking_plans table");

    // Create staking_positions table
    await sql`
      CREATE TABLE IF NOT EXISTS staking_positions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        staking_plan_id INTEGER NOT NULL REFERENCES staking_plans(id),
        wallet_address TEXT NOT NULL,
        amount_staked NUMERIC(20, 8) NOT NULL,
        rewards_earned NUMERIC(20, 8) NOT NULL DEFAULT 0,
        last_reward_calculation TIMESTAMP NOT NULL DEFAULT NOW(),
        start_date TIMESTAMP NOT NULL DEFAULT NOW(),
        end_date TIMESTAMP NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        transaction_hash TEXT NOT NULL,
        withdrawal_transaction_hash TEXT,
        has_withdrawn BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `.execute(db);
    console.log("Created staking_positions table");

    // Insert default staking plans
    await sql`
      INSERT INTO staking_plans (name, description, min_amount, lock_period_days, apr_percentage)
      VALUES 
        ('Basic Staking', 'Lock your CPXTB tokens for 30 days and earn 5% APR', 100, 30, 5),
        ('Silver Staking', 'Lock your CPXTB tokens for 90 days and earn 8% APR', 500, 90, 8),
        ('Gold Staking', 'Lock your CPXTB tokens for 180 days and earn 12% APR', 1000, 180, 12),
        ('Platinum Staking', 'Lock your CPXTB tokens for 365 days and earn 18% APR', 5000, 365, 18)
      ON CONFLICT DO NOTHING;
    `.execute(db);
    console.log("Inserted default staking plans");

    console.log("Staking tables migration completed successfully");
    return true;
  } catch (error) {
    console.error("Error creating staking tables:", error);
    throw error;
  }
}