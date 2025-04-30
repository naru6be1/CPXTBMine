import { storage } from './server/storage';
import { db } from './server/db';
import { sql } from 'drizzle-orm';

// This script finds completed payments that haven't had emails sent and resends them
async function retryPaymentEmails() {
  try {
    console.log('\n===============================');
    console.log('PAYMENT EMAIL RETRY UTILITY');
    console.log('===============================');
    
    // Get completed payments that haven't had emails sent
    const query = `
      SELECT p.id, p.payment_reference, p.status, p.email_sent, p.transaction_hash, p.merchant_id, m.contact_email, m.business_name
      FROM payments p 
      JOIN merchants m ON p.merchant_id = m.id 
      WHERE p.status = 'completed' AND p.email_sent = false
      ORDER BY p.updated_at DESC 
      LIMIT 10;
    `;
    
    const result = await db.execute(sql.raw(query));
    const payments = result;
    
    console.log(`Found ${payments.length} completed payments that need email notifications`);
    
    if (payments.length === 0) {
      console.log('No emails to send. Exiting.');
      return;
    }
    
    // Import the email function dynamically
    const { sendPaymentConfirmationEmail } = await import('./server/email');
    
    // Process each payment
    for (const payment of payments) {
      console.log(`\nProcessing payment ID ${payment.id} (${payment.payment_reference}) for ${payment.business_name}`);
      
      // Get the full payment record
      const fullPayment = await storage.getPayment(payment.id);
      if (!fullPayment) {
        console.log(`Payment ${payment.id} not found in database. Skipping.`);
        continue;
      }
      
      // Get the merchant record
      const merchant = await storage.getMerchant(payment.merchant_id);
      if (!merchant) {
        console.log(`Merchant ${payment.merchant_id} not found. Skipping.`);
        continue;
      }
      
      console.log(`Sending email to ${merchant.contactEmail} for payment ${payment.payment_reference}...`);
      
      // Send the email
      const emailSent = await sendPaymentConfirmationEmail(merchant, fullPayment);
      
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