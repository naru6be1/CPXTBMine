// NEW DEDICATED EMAIL SERVICE
// This service uses a unique constraint in the database to absolutely prevent duplicate emails
// By combining the payment ID and email type into a unique key, we guarantee uniqueness

import { db } from './db';
import { emailLog } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { sendPaymentConfirmationEmail } from './email';
import { Merchant, Payment } from '@shared/schema';

/**
 * This function uses a database-level unique constraint to absolutely prevent duplicate emails
 * It follows the "insert-first" pattern where we attempt to insert a record before sending the email
 * If the insert fails, we know that the email has already been attempted
 */
export async function sendPaymentEmail(merchant: Merchant, payment: Payment): Promise<boolean> {
  try {
    // Create a unique key for this email - combination of payment ID and email type
    const emailKey = `payment_${payment.id}_confirmation`;
    
    // First: Try to insert a record into email_log 
    // This will fail with a unique constraint violation if already exists
    console.log(`🔐 ABSOLUTE PROTECTION: Attempting to create email log entry with key: ${emailKey}`);
    
    try {
      // Use a raw SQL insert with ON CONFLICT DO NOTHING to handle the potential duplicate
      // This is the most reliable way to prevent race conditions
      const insertResult = await db.execute(sql`
        INSERT INTO email_log (payment_id, email_type, email_key, recipient)
        VALUES (${payment.id}, 'payment_confirmation', ${emailKey}, ${merchant.contactEmail})
        ON CONFLICT (email_key) DO NOTHING
        RETURNING id
      `);
      
      // If no row was inserted (empty result), then this email was already sent
      const hasResults = Array.isArray(insertResult) && insertResult.length > 0;
      const recordCreated = hasResults && insertResult[0] && 'id' in insertResult[0];
      
      if (!recordCreated) {
        console.log(`✅ DUPLICATE PREVENTED: Email ${emailKey} was already sent or is being sent`);
        
        // Verify by checking for the existing record
        const existingLog = await db.execute(sql`
          SELECT * FROM email_log WHERE email_key = ${emailKey}
        `);
        
        const logRecord = Array.isArray(existingLog) && existingLog.length > 0 ? existingLog[0] : null;
        console.log(`🔍 Existing email record found:`, logRecord);
        
        // Return success - we're considering this "already sent" as success
        return true;
      }
      
      // If we get here, we've successfully inserted the record and need to send the email
      const insertedId = recordCreated && insertResult[0] && 'id' in insertResult[0] ? 
        insertResult[0].id : 'unknown';
      console.log(`✅ NEW EMAIL: Successfully created email log entry (ID: ${insertedId}) - sending email...`);
      
      // Now send the actual email
      const emailSent = await sendPaymentConfirmationEmail(merchant, payment);
      
      if (emailSent) {
        console.log(`✉️ SENT: Email successfully sent to ${merchant.contactEmail} for payment ${payment.id}`);
        
        // Also mark the payment as having had email sent if it hasn't been marked
        if (!payment.emailSent) {
          await db.execute(sql`
            UPDATE payments 
            SET email_sent = true 
            WHERE id = ${payment.id} AND email_sent = false
          `);
        }
        
        return true;
      } else {
        console.error(`❌ ERROR: Failed to send email to ${merchant.contactEmail} for payment ${payment.id}`);
        
        // We DON'T delete the email log entry even if sending failed
        // This prevents retries and potential duplicates and allows manual retry if needed
        return false;
      }
    } catch (insertError: any) {
      // If insert failed due to a unique constraint violation, that means the email was already sent
      if (insertError.message?.includes('duplicate key') || insertError.message?.includes('unique constraint')) {
        console.log(`✅ DUPLICATE PREVENTED: Email ${emailKey} was already sent or is being sent (caught by DB constraint)`);
        return true;
      }
      
      // For other errors, rethrow
      throw insertError;
    }
  } catch (error) {
    console.error('❌ EMAIL SERVICE ERROR:', error);
    return false;
  }
}