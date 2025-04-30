import { storage } from './server/storage';
import { sendPaymentConfirmationEmail } from './server/email';
import { createPublicClient, http } from 'viem';
import { base } from 'wagmi/chains';

// This script tests the prevention of duplicate emails
async function testDuplicateEmailPrevention() {
  try {
    // Test 1: Create a test merchant
    console.log('\n===============================');
    console.log('TEST 1: Testing duplicate email prevention');
    console.log('===============================');
    
    // Get a payment from the database to test with
    const payments = await storage.getPaymentsByMerchant(7); // Assuming merchant ID 7 exists
    
    if (payments.length === 0) {
      console.log('No payments found for testing');
      return;
    }
    
    const testPayment = payments[0];
    const merchant = await storage.getMerchant(testPayment.merchantId);
    
    if (!merchant) {
      console.log('Merchant not found');
      return;
    }
    
    console.log(`Using payment ID ${testPayment.id} with reference ${testPayment.paymentReference}`);
    console.log(`Payment emailSent flag is currently: ${testPayment.emailSent}`);
    
    // First call should succeed (or at least not fail due to duplicate check)
    console.log('\nAttempting first email send...');
    const firstResult = await sendPaymentConfirmationEmail(merchant, testPayment);
    console.log(`First email send result: ${firstResult ? 'SUCCESS' : 'FAILED'}`);
    
    // Fetch the updated payment
    const updatedPayment = await storage.getPayment(testPayment.id);
    console.log(`Payment emailSent flag is now: ${updatedPayment?.emailSent}`);
    
    // Second call should detect duplicate and skip sending
    console.log('\nAttempting duplicate email send...');
    const secondResult = await sendPaymentConfirmationEmail(merchant, updatedPayment!);
    console.log(`Second email send result: ${secondResult ? 'SUCCESS' : 'FAILED'}`);
    console.log('If duplicate prevention is working, the second attempt should skip sending the email.\n');
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Run the test
testDuplicateEmailPrevention();