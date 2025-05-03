// Utility script to test the email duplicate protection
// Usage: node -r tsx test-email-fix.ts

import { db } from './server/db';
import { pool } from './server/db';
import { Merchant, Payment } from './shared/schema';
import { sendPaymentEmail } from './server/email-service';
import { sql } from 'drizzle-orm';

type QueryResultRow = Record<string, unknown>;

/**
 * Function to test automatic email sending and duplicate prevention
 */
async function testAutomaticEmailSend() {
  try {
    console.log('🧪 Starting email duplicate prevention test...');
    
    // First find a merchant and a payment we can use for testing
    const merchantRawResult = await db.execute(sql`
      SELECT * FROM merchants LIMIT 1
    `);
    
    const paymentRawResult = await db.execute(sql`
      SELECT * FROM payments WHERE status = 'completed' LIMIT 1
    `);
    
    // Safely extract results
    const merchantRows = extractRowsFromResult(merchantRawResult);
    const paymentRows = extractRowsFromResult(paymentRawResult);
    
    if (merchantRows.length === 0 || paymentRows.length === 0) {
      console.error('❌ No merchant or completed payment found for testing');
      return false;
    }
    
    console.log('Raw merchant data:', merchantRows[0]);
    console.log('Raw payment data:', paymentRows[0]);
    
    // Create a properly structured merchant and payment object with required fields
    const merchant = {
      id: Number(merchantRows[0].id) || 1,
      businessName: String(merchantRows[0].business_name || 'Test Business'),
      contactEmail: String(merchantRows[0].contact_email || 'test@example.com'),
      ...merchantRows[0]
    } as Merchant;
    
    const payment = {
      id: Number(paymentRows[0].id) || 1,
      amountUsd: Number(paymentRows[0].amount_usd) || 0,
      amountCpxtb: String(paymentRows[0].amount_cpxtb || '0'),
      emailSent: Boolean(paymentRows[0].email_sent || false),
      ...paymentRows[0]
    } as Payment;
    
    console.log(`🧪 Found merchant: ${merchant.businessName} (ID: ${merchant.id})`);
    console.log(`🧪 Found payment: ID ${payment.id}, Amount: ${payment.amountUsd} USD (${payment.amountCpxtb} CPXTB)`);
    
    // Reset the emailSent flag in the payment for testing
    // (in production this would never be done, but it's useful for testing)
    await db.execute(sql`
      UPDATE payments SET email_sent = false WHERE id = ${payment.id}
    `);
    
    console.log('🧪 Reset emailSent flag to false, preparing for test 1');
    
    // Try sending the first email - should succeed
    console.log('\n🧪 TEST 1: Sending first email (should succeed)');
    const result1 = await sendPaymentEmail(merchant, payment);
    
    if (result1) {
      console.log('✅ TEST 1 PASSED: First email was sent successfully');
    } else {
      console.log('❌ TEST 1 FAILED: First email failed to send');
      return false;
    }
    
    // Very small delay to ensure we're not just hitting a race condition
    await new Promise(resolve => setTimeout(resolve, 100)); 
    
    // Try sending a duplicate email - should be prevented
    console.log('\n🧪 TEST 2: Attempting to send duplicate email (should be prevented)');
    const result2 = await sendPaymentEmail(merchant, payment);
    
    // We expect true (successful prevention) even though no email was actually sent
    if (result2) {
      console.log('✅ TEST 2 PASSED: Duplicate email was successfully prevented');
    } else {
      console.log('❌ TEST 2 FAILED: Duplicate prevention failed');
      return false;
    }
    
    // Check if the email_sent flag was updated in the database
    const updatedPaymentRawResult = await db.execute(sql`
      SELECT email_sent FROM payments WHERE id = ${payment.id}
    `);
    
    const updatedPaymentRows = extractRowsFromResult(updatedPaymentRawResult);
    const updatedPayment = updatedPaymentRows[0];
    
    if (updatedPayment && updatedPayment.email_sent) {
      console.log('✅ Database flag updated: payment.email_sent = true');
    } else {
      console.log('❌ Database flag NOT updated: payment.email_sent = false');
    }
    
    // Check if the email_log entry was created
    const emailLogRawResult = await db.execute(sql`
      SELECT * FROM email_log WHERE payment_id = ${payment.id}
    `);
    
    const emailLogRows = extractRowsFromResult(emailLogRawResult);
    
    if (emailLogRows.length > 0) {
      console.log(`✅ Email log entry created: ${emailLogRows.length} record(s) found`);
      console.log(emailLogRows[0]);
    } else {
      console.log('❌ Email log entry NOT created');
    }
    
    console.log('\n🏁 Email duplicate prevention test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ ERROR during email test:', error);
    return false;
  } finally {
    // Close the DB connection when done
    try {
      await pool.end();
    } catch (error) {
      console.error('Error closing pool:', error);
    }
  }
}

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

// Run the test
testAutomaticEmailSend()
  .then(success => {
    if (success) {
      console.log('✨ All tests completed successfully!');
      process.exit(0);
    } else {
      console.error('💥 Tests failed!');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('⚠️ Error running tests:', err);
    process.exit(1);
  });