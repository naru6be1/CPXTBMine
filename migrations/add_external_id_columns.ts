import { pool, db } from '../server/db';
import { users } from '../shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Migration to add external_id and provider columns to users table
 * This allows for storing large string IDs from providers like Google
 */
async function addExternalIdColumns() {
  try {
    console.log('Starting migration to add external_id and provider columns...');
    
    // Check if the columns already exist to avoid errors on re-running
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'external_id'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('Columns do not exist yet, adding them...');
      
      // Add the new columns
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS external_id TEXT,
        ADD COLUMN IF NOT EXISTS provider TEXT
      `);
      
      console.log('Successfully added external_id and provider columns to users table');
    } else {
      console.log('Columns already exist, skipping migration');
    }
    
    return true;
  } catch (error) {
    console.error('Error in external ID columns migration:', error);
    throw error;
  }
}

// Execute the migration
addExternalIdColumns()
  .then(() => {
    console.log('External ID columns migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('External ID columns migration failed:', error);
    process.exit(1);
  });