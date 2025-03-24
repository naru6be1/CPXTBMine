import { db } from "./db";
import { users } from "@shared/schema";
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
  }
};
