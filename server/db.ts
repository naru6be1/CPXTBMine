import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Log environment and connection details (without exposing sensitive data)
console.log(`Server environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Database connection attempt starting...`);

// Use single database URL for both development and production
if (!process.env.DATABASE_URL) {
  console.error('Critical Error: DATABASE_URL environment variable is not set');
  console.error('Please add DATABASE_URL to your deployment secrets');
  console.error('Environment variables available:', Object.keys(process.env).join(', '));
  process.exit(1); // Exit with error code instead of throwing exception for clearer error
}

// Create connection pool with explicit ssl configuration
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
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

// Verify database connection
pool.connect()
  .then(client => {
    console.log('Successfully connected to database');
    client.release();
  })
  .catch(err => {
    console.error('Failed to connect to database:', err.message);
    throw err;
  });

// Log initialization completion
console.log('Database initialization completed');