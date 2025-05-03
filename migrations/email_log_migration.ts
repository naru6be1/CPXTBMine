import { db } from '../server/db';
import { sql } from 'drizzle-orm';

/**
 * Migration to add email_log table to prevent duplicate emails
 * This introduces a specialized table with a unique constraint to guarantee uniqueness
 */
async function createEmailLogTable() {
  console.log('⏳ Running email_log table migration...');
  
  try {
    // First check if the table already exists to avoid errors on re-runs
    const checkTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'email_log'
      )
    `);
    
    // Check if table exists and skip if it does
    if (checkTableExists[0]?.exists) {
      console.log('✓ email_log table already exists, skipping creation');
    } else {
      // Create the email_log table with explicit constraint
      await db.execute(sql`
        CREATE TABLE email_log (
          id SERIAL PRIMARY KEY,
          payment_id INTEGER NOT NULL,
          email_type TEXT NOT NULL,
          email_key TEXT NOT NULL,
          recipient TEXT NOT NULL,
          sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          UNIQUE(email_key)
        )
      `);
      
      // Add an additional explicit index on the combination of payment_id, email_type
      // This helps to quickly find all emails for a specific payment
      await db.execute(sql`
        CREATE INDEX idx_email_log_payment_type ON email_log (payment_id, email_type)
      `);
      
      console.log('✅ email_log table created successfully');
    }
    
    return true;
  } catch (error) {
    console.error('❌ ERROR creating email_log table:', error);
    return false;
  }
}

// Run the migration
createEmailLogTable().then(success => {
  if (success) {
    console.log('Migration completed successfully');
  } else {
    console.error('Migration failed');
  }
});