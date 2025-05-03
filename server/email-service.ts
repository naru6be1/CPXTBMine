// NEW DEDICATED EMAIL SERVICE
// This service uses a unique constraint in the database to absolutely prevent duplicate emails
// By combining the payment ID and email type into a unique key, we guarantee uniqueness

import { db } from './db';
import { emailLog } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { sendPaymentConfirmationEmail } from './email';
import { Merchant, Payment } from '@shared/schema';

type QueryResultRow = Record<string, unknown>;

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
      // Use explicit type casting for PostgreSQL
      const paymentId = payment.id;
      const contactEmail = merchant.contactEmail || 'unknown@example.com';
      
      const rawResult = await db.execute(sql`
        INSERT INTO email_log (payment_id, email_type, email_key, recipient)
        VALUES (${paymentId}, 'payment_confirmation', ${emailKey}, ${contactEmail})
        ON CONFLICT (email_key) DO NOTHING
        RETURNING id
      `);
      
      // Since TypeScript doesn't know the structure of rawResult,
      // we need to safely navigate it
      let resultRows: QueryResultRow[] = [];
      
      // Handle potential array-like result
      if (rawResult && typeof rawResult === 'object') {
        if (Array.isArray(rawResult)) {
          resultRows = rawResult as QueryResultRow[];
        } else if ('rows' in rawResult && Array.isArray((rawResult as any).rows)) {
          resultRows = (rawResult as any).rows;
        }
      }
      
      // Check if we have any result rows
      const hasRows = resultRows.length > 0;
      
      // Check if the first row has an ID
      const firstRow = hasRows ? resultRows[0] : undefined;
      const hasId = firstRow && typeof firstRow === 'object' && 'id' in firstRow;
      
      if (!hasId) {
        console.log(`✅ DUPLICATE PREVENTED: Email ${emailKey} was already sent or is being sent`);
        
        // Verify by checking for the existing record
        const existingRawResult = await db.execute(sql`
          SELECT * FROM email_log WHERE email_key = ${emailKey}
        `);
        
        // Same safe navigation as above
        let existingRows: QueryResultRow[] = [];
        if (existingRawResult && typeof existingRawResult === 'object') {
          if (Array.isArray(existingRawResult)) {
            existingRows = existingRawResult as QueryResultRow[];
          } else if ('rows' in existingRawResult && Array.isArray((existingRawResult as any).rows)) {
            existingRows = (existingRawResult as any).rows;
          }
        }
        
        const existingLog = existingRows.length > 0 ? existingRows[0] : null;
        console.log(`🔍 Existing email record found:`, existingLog || 'None');
        
        // Also mark the payment as having had email sent if it hasn't been marked
        // This ensures consistency even if the original email send didn't update this flag
        if (!payment.emailSent) {
          try {
            await db.execute(sql`
              UPDATE payments 
              SET email_sent = true 
              WHERE id = ${payment.id} AND email_sent = false
            `);
            console.log(`✅ Updated email_sent status for payment ${payment.id} during duplicate check`);
          } catch (updateError) {
            console.error(`❌ Failed to update email_sent status:`, updateError);
            // We don't fail the operation if this update fails
          }
        }
        
        // Return success - we're considering this "already sent" as success
        return true;
      }
      
      // If we get here, we've successfully inserted the record and need to send the email
      const insertedId = hasId && firstRow ? String(firstRow.id) : 'unknown';
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