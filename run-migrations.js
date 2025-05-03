// Simple script to run database migrations directly
// Usage: node run-migrations.js

const { pool } = require('./server/db');
const { log } = require('./server/vite');

async function createEmailLogTable() {
  console.log('⏳ Running email_log table migration...');
  
  try {
    // First check if the table already exists to avoid errors on re-runs
    const checkTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'email_log'
      )
    `);
    
    const exists = checkTableResult.rows[0]?.exists;
    
    if (exists) {
      console.log('✓ email_log table already exists, skipping creation');
    } else {
      // Create the email_log table with explicit constraint
      await pool.query(`
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
      await pool.query(`
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

async function runMigrations() {
  try {
    console.log('⏳ Running all database migrations...');
    
    // Run migrations
    await createEmailLogTable();
    
    console.log('✅ All migrations completed');
    return true;
  } catch (error) {
    console.error('❌ ERROR running migrations:', error);
    return false;
  } finally {
    // Always close the pool when done
    await pool.end();
  }
}

// Run migrations
runMigrations()
  .then(success => {
    if (success) {
      console.log('Migration script executed successfully');
      process.exit(0);
    } else {
      console.error('Migration script failed');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Migration script error:', err);
    process.exit(1);
  });