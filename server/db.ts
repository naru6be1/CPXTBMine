import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Add more robust error handling for DATABASE_URL
let dbConnectionString = process.env.DATABASE_URL;

if (!dbConnectionString) {
  console.error("DATABASE_URL environment variable is not set!");
  console.error("Using fallback connection string for development. This will NOT work in production.");
  
  // In deployment, we'll fail later with a clearer error instead of crashing immediately
  if (process.env.NODE_ENV === 'production') {
    // For production, we'll use a delayed error approach
    dbConnectionString = 'postgres://invalid:invalid@localhost:5432/invalid';
  } else {
    // For development, try to use local Postgres if available
    dbConnectionString = 'postgres://postgres:postgres@localhost:5432/postgres';
  }
}

// Create pool with error handling for connection failures
let pool: Pool;
try {
  console.log("Attempting database connection...");
  pool = new Pool({ connectionString: dbConnectionString });
  console.log("Database pool created successfully");
} catch (error) {
  console.error("Failed to create database pool:", error);
  // Create a dummy pool that will throw clear errors when used
  pool = new Pool({ connectionString: 'postgres://invalid:invalid@localhost:5432/invalid' });
}

export const pool_export = pool; // Export for direct usage if needed
export const db = drizzle({ client: pool, schema });

// Export a health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

// Verify database connection, but handle errors gracefully
pool.connect()
  .then(client => {
    console.log('Successfully connected to database');
    client.release();
  })
  .catch(err => {
    console.error('Failed to connect to database:', err.message);
    // Log the error but don't crash the application
    console.error('Database connection failed, but continuing execution for health checks');
  });