import { pool } from './server/db.js';

async function addSuccessUrlColumn() {
  console.log('Starting migration to add success_url column...');
  
  try {
    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'payments' AND column_name = 'success_url';
    `;
    
    const { rows: existingColumns } = await pool.query(checkColumnQuery);
    
    if (existingColumns.length === 0) {
      console.log('Column success_url does not exist, adding it now...');
      
      // Add the success_url column
      const addColumnQuery = `
        ALTER TABLE payments
        ADD COLUMN success_url TEXT;
      `;
      
      await pool.query(addColumnQuery);
      console.log('Successfully added success_url column to payments table');
    } else {
      console.log('Column success_url already exists, no migration needed');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error executing migration:', error);
    throw error;
  } finally {
    // Close the pool when done
    await pool.end();
  }
}

// Run the migration
addSuccessUrlColumn()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });