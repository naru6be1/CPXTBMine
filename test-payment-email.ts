import { storage } from './server/storage';
import { sendPaymentConfirmationEmail } from './server/email';
import { Payment } from './shared/schema';

async function testEmailNotification() {
  try {
    // Get a merchant from the database
    const merchantId = 1; // Using merchant ID 1 for testing
    const merchant = await storage.getMerchant(merchantId);
    
    if (!merchant) {
      console.error(`Merchant with ID ${merchantId} not found`);
      return;
    }
    
    console.log(`Found merchant: ${merchant.businessName} with email ${merchant.contactEmail}`);
    
    // Get recent payments for this merchant or create a mock one if none exist
    const recentPayments = await storage.getPaymentsByMerchant(merchantId);
    
    let testPayment: Payment;
    
    if (recentPayments.length > 0) {
      // Use the most recent payment
      testPayment = recentPayments[0];
      console.log(`Using existing payment ID: ${testPayment.id}, Reference: ${testPayment.paymentReference}`);
    } else {
      // Create a mock payment object for testing
      console.log('No existing payments found. Creating a mock payment object...');
      
      testPayment = {
        id: 9999,
        merchantId: merchant.id,
        orderId: 'TEST-ORDER-123',
        paymentReference: 'TEST-REF-' + Date.now(),
        amountUsd: '50.00',
        amountCpxtb: '25000',
        status: 'completed',
        transactionHash: '0x' + '1'.repeat(64),
        completedAt: new Date(),
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        customerWalletAddress: '0x' + '2'.repeat(40),
        receivedAmount: '25000',
        requiredAmount: '25000',
        remainingAmount: '0',
        exchangeRate: '0.002',
        securityStatus: 'passed',
        callbackStatus: null,
        callbackResponse: null,
        description: 'Test payment for email notification',
        securityVerifiedAt: new Date(),
        metadata: JSON.stringify({
          securityStatus: 'passed',
          verifiedAt: new Date().toISOString(),
        })
      } as Payment;
    }
    
    // Force the status to completed for testing
    if (testPayment.status !== 'completed') {
      console.log(`Setting payment status to 'completed' for testing (was '${testPayment.status}')`);
      testPayment.status = 'completed';
      testPayment.completedAt = new Date();
    }
    
    console.log('Sending test payment notification email...');
    const result = await sendPaymentConfirmationEmail(merchant, testPayment);
    
    if (result) {
      console.log('\n✅ Email sending successful!');
      console.log('In development mode, the email is not actually sent but logged to the console.');
    } else {
      console.error('\n❌ Email sending failed.');
    }
    
    console.log('\nTest completed!');
  } catch (error) {
    console.error('Error testing payment notification:', error);
  }
}

// Run the test
testEmailNotification()
  .then(() => console.log('Test script completed.'))
  .catch(error => console.error('Unhandled error in test script:', error))
  .finally(() => process.exit(0));