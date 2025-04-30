import { storage } from './server/storage';
import { db } from './server/db';
import { payments } from './shared/schema';
import { eq, and, not, inArray } from 'drizzle-orm';

// List of payment IDs that already had emails sent in previous runs
const processedPaymentIds = [20, 31, 32, 33, 34, 35, 36, 37, 38, 39, 41];

// This script finds completed payments that haven't had emails sent and resends them
async function retryPaymentEmails() {
  try {
    console.log('\n===============================');
    console.log('PAYMENT EMAIL RETRY UTILITY - FINAL BATCH');
    console.log('===============================');
    
    // Get completed payments that haven't had emails sent, excluding already processed ones
    const unsentPayments = await db.select()
      .from(payments)
      .where(
        and(
          eq(payments.status, 'completed'),
          eq(payments.emailSent, false),
          not(inArray(payments.id, processedPaymentIds))
        )
      )
      .limit(10);
    
    console.log(`Found ${unsentPayments.length} remaining completed payments that need email notifications`);
    
    if (unsentPayments.length === 0) {
      console.log('No more emails to send. All payments have been processed.');
      return;
    }
    
    // Import the email function dynamically
    const { sendPaymentConfirmationEmail } = await import('./server/email');
    
    // Process each payment
    for (const payment of unsentPayments) {
      console.log(`\nProcessing payment ID ${payment.id} (${payment.paymentReference})`);
      
      // Get the merchant record
      const merchant = await storage.getMerchant(payment.merchantId);
      if (!merchant) {
        console.log(`Merchant ${payment.merchantId} not found. Skipping.`);
        continue;
      }
      
      console.log(`Sending email to ${merchant.contactEmail} for payment ${payment.paymentReference}...`);
      
      // Send the email
      const emailSent = await sendPaymentConfirmationEmail(merchant, payment);
      
      if (emailSent) {
        console.log(`✅ Successfully sent email for payment ${payment.id}`);
      } else {
        console.log(`❌ Failed to send email for payment ${payment.id}`);
      }
    }
    
    console.log('\nEmail retry process completed! All merchants should now have received their payment notifications.');
  } catch (error) {
    console.error('Error retrying payment emails:', error);
  }
}

// Run the retry function
retryPaymentEmails();