#!/usr/bin/env tsx
/**
 * This script verifies the effectiveness of our email duplicate protection system
 * by checking the email_log table for any duplicate entries.
 * 
 * Run with: npx tsx verify-email-protection.ts
 */

import { db } from './server/db';
import { pool } from './server/db';
import { sql } from 'drizzle-orm';

type QueryResultRow = Record<string, unknown>;

// Helper function to safely extract rows from query results
function extractRowsFromResult(result: unknown): QueryResultRow[] {
  let rows: QueryResultRow[] = [];
  
  if (result && typeof result === 'object') {
    if (Array.isArray(result)) {
      rows = result as QueryResultRow[];
    } else if ('rows' in result && Array.isArray((result as any).rows)) {
      rows = (result as any).rows;
    }
  }
  
  return rows;
}

async function verifyEmailProtection() {
  try {
    console.log('🔍 Checking email protection system...');
    
    // Get total count of email logs
    const countRawResult = await db.execute(sql`
      SELECT COUNT(*) as total FROM email_log
    `);
    
    const countRows = extractRowsFromResult(countRawResult);
    const totalEmails = Number(countRows[0]?.total || 0);
    
    console.log(`📊 Total email log entries: ${totalEmails}`);
    
    // Check for any duplicate email_key values (shouldn't be possible due to the constraint)
    const duplicateRawResult = await db.execute(sql`
      SELECT email_key, COUNT(*) as count
      FROM email_log
      GROUP BY email_key
      HAVING COUNT(*) > 1
    `);
    
    const duplicateRows = extractRowsFromResult(duplicateRawResult);
    
    if (duplicateRows.length > 0) {
      console.error('❌ CRITICAL: Found duplicate email_key entries:');
      console.error(duplicateRows);
      return false;
    } else {
      console.log('✅ No duplicate email_key entries found - protection is working!');
    }
    
    // Check for recent email logs
    const recentRawResult = await db.execute(sql`
      SELECT * FROM email_log
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    const recentRows = extractRowsFromResult(recentRawResult);
    
    console.log(`📧 Recent email logs (${recentRows.length}):`);
    recentRows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.email_key} - ${row.recipient} (sent at: ${row.sent_at})`);
    });
    
    // Show a summary of email types
    const typeRawResult = await db.execute(sql`
      SELECT email_type, COUNT(*) as count
      FROM email_log
      GROUP BY email_type
    `);
    
    const typeRows = extractRowsFromResult(typeRawResult);
    
    console.log('\n📊 Email type breakdown:');
    typeRows.forEach(row => {
      console.log(`- ${row.email_type}: ${row.count} emails`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error during email protection verification:', error);
    return false;
  } finally {
    try {
      await pool.end();
    } catch (error) {
      console.error('Error closing pool:', error);
    }
  }
}

// Run the verification
verifyEmailProtection()
  .then(success => {
    if (success) {
      console.log('\n✨ Email protection system verification completed successfully!');
      process.exit(0);
    } else {
      console.error('\n💥 Email protection system verification failed!');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('⚠️ Error running verification:', err);
    process.exit(1);
  });