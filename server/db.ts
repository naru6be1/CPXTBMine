import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Ensure DATABASE_URL is set and properly formatted
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool with explicit ssl configuration
export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for some Replit environments
  }
});

export const db = drizzle(pool, { schema });

// Add error handling for connection issues
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});