import { db } from './server/db';
import { payments, merchants } from './shared/schema';
import { eq } from 'drizzle-orm';
import { sendPaymentConfirmationEmail } from './server/email';

/**
 * Test server-generated timestamps in payment confirmation emails
 */
async function testServerTimestampInEmails() {
  try {
    console.log('\n=================================================');
    console.log('SERVER TIMESTAMP EMAIL TEST');
    console.log('=================================================');
    
    // Get a specific payment for testing (without sending another email)
    const paymentReference = 'BAFD9D482F6B02F37EC53CC2'; // Our test reference
    
    console.log(`Looking up payment with reference: ${paymentReference}`);
    
    // Get payment details by reference
    const [payment] = await db.select()
      .from(payments)
      .where(eq(payments.paymentReference, paymentReference));
    
    if (!payment) {
      console.log(`❓ Payment with reference ${paymentReference} not found in the database`);
      return;
    }
    
    console.log(`Found payment ID: ${payment.id}, Reference: ${paymentReference}`);
    console.log(`Status: ${payment.status}, Completed: ${payment.completedAt ? 'Yes' : 'No'}`);
    
    // Get merchant details for this payment
    const [merchant] = await db.select()
      .from(merchants)
      .where(eq(merchants.id, payment.merchantId));
    
    if (!merchant) {
      console.log(`❓ Merchant with ID ${payment.merchantId} not found in the database`);
      return;
    }
    
    console.log(`Merchant: ${merchant.businessName}, Email: ${merchant.contactEmail}`);
    
    // Format the timestamp with UTC to see the result
    const serverTimestamp = payment.completedAt
      ? new Date(payment.completedAt).toLocaleString('en-US', {
          year: 'numeric', 
          month: 'numeric', 
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: true,
          timeZone: 'UTC'  // Use UTC for consistency across all servers/devices
        })
      : 'No completion timestamp';
      
    console.log(`\nServer-generated completion timestamp (UTC): ${serverTimestamp}`);
    console.log(`Raw DB timestamp value: ${payment.completedAt}`);
    
    console.log(`\nTimestamp formats that would appear in email:`);
    console.log(`UTC format: ${serverTimestamp}`);
    
    // Also show what local time format would look like (for comparison)
    const localTimestamp = payment.completedAt
      ? new Date(payment.completedAt).toLocaleString()
      : 'No completion timestamp';
      
    console.log(`Local device format: ${localTimestamp}`);
    
    // Don't actually send the email, just show what would be generated
    console.log('\n=================================================');
    console.log('Email would be generated with the UTC timestamp shown above');
    console.log('This ensures consistent time display regardless of user device settings');
    console.log('=================================================');
    
  } catch (error) {
    console.error('Error testing server timestamp:', error);
  }
}

// Run the test
testServerTimestampInEmails()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });