import { db } from "./db";
import { users, miningPlans } from "@shared/schema";
import { eq } from "drizzle-orm";

// Test utilities for CPXTB claiming
export const testUtils = {
  // Reset user's last claim time for testing
  async resetClaimCooldown(address: string) {
    const normalizedAddress = address.toLowerCase();
    await db
      .update(users)
      .set({ lastCPXTBClaimTime: null })
      .where(eq(users.username, normalizedAddress));
  },

  // Set custom claim time for testing
  async setCustomClaimTime(address: string, time: Date) {
    const normalizedAddress = address.toLowerCase();
    await db
      .update(users)
      .set({ lastCPXTBClaimTime: time })
      .where(eq(users.username, normalizedAddress));
  },

  // Reset rate limit for an address
  async resetRateLimit(address: string) {
    // Since rate limits are stored in memory (Map), we need to expose this through the routes
    return true;
  },

  // Get remaining claims for an address
  async getRemainingClaims(address: string) {
    // This will be handled by the rate limit endpoint
    return 3; // Default max claims
  }
};