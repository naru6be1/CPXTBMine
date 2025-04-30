import { storage } from './server/storage';
import { db } from './server/db';
import { payments } from './shared/schema';
import { eq, and } from 'drizzle-orm';

// This script finds completed payments that haven't had emails sent and resends them
async function retryPaymentEmails() {
  try {
    console.log('\n===============================');
    console.log('PAYMENT EMAIL RETRY UTILITY');
    console.log('===============================');
    
    // Get completed payments that haven't had emails sent
    const unsentPayments = await db.select()
      .from(payments)
      .where(
        and(
          eq(payments.status, 'completed'),
          eq(payments.emailSent, false)
        )
      )
      .limit(10);
    
    console.log(`Found ${unsentPayments.length} completed payments that need email notifications`);
    
    if (unsentPayments.length === 0) {
      console.log('No emails to send. Exiting.');
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
    
    console.log('\nEmail retry process completed!');
  } catch (error) {
    console.error('Error retrying payment emails:', error);
  }
}

// Run the retry function
retryPaymentEmails();