import { db } from './server/db';
import { storage } from './server/storage';
import { payments, merchants } from './shared/schema';
import { eq } from 'drizzle-orm';

async function testAutomaticEmailSend() {
  console.log('🧪 Testing automatic payment confirmation email sending...');
  
  try {
    // Create test data - merchant
    const [testMerchant] = await db
      .insert(merchants)
      .values({
        userId: 1, // Use a test user ID
        businessName: 'Test Auto Email Business',
        walletAddress: '0xce3CB5b5A05eDC80594F84740Fd077c80292Bd27', // Standard test wallet
        contactEmail: 'test-auto@example.com',
        apiKey: 'test-auto-email-apikey-' + Date.now(),
        logo: null,
        active: true,
        customDomain: null,
        description: 'Test merchant for automatic email sending',
        successRedirectUrl: 'https://example.com/success',
        cancelRedirectUrl: 'https://example.com/cancel',
        theme: null,
        webhookUrl: null,
        business_type: 'Other', // Added required business_type field
        primaryColor: '#3b82f6', // Default primary color
        secondaryColor: '#10b981', // Default secondary color
        accentColor: '#f59e0b', // Default accent color  
        fontFamily: 'Inter', // Default font
        borderRadius: 8, // Default border radius
        darkMode: false // Default theme mode
      })
      .returning();
    
    console.log(`✓ Created test merchant: ${testMerchant.id} (${testMerchant.businessName})`);
    
    // Create a test payment
    const [testPayment] = await db
      .insert(payments)
      .values({
        merchantId: testMerchant.id,
        paymentReference: 'auto-email-test-' + Date.now(),
        walletAddress: '0xce3CB5b5A05eDC80594F84740Fd077c80292Bd27',
        amountUsd: '10.00',
        amountCpxtb: '4500.000000',
        status: 'pending',
        customerEmail: 'customer@example.com',
        customerName: 'Auto Email Test Customer',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        completedAt: null,
        failedAt: null,
        cancelledAt: null,
        transactionHash: null,
        metadata: null,
        orderId: 'TEST-ORDER-AUTO-EMAIL',
        emailSent: false,
        callbackUrl: null,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Script',
        receivedAmount: null,
        requiredAmount: null,
        remainingAmount: null,
        securityStatus: null,
        securityVerifiedAt: null
      })
      .returning();
    
    console.log(`✓ Created test payment: ${testPayment.id} (${testPayment.paymentReference})`);
    
    // Update the payment status to completed - this should trigger an email
    console.log('⏳ Updating payment status to completed...');
    const updatedPayment = await storage.updatePaymentStatus(
      testPayment.id,
      'completed',
      '0x' + 'test'.padStart(64, '0'), // Mock transaction hash
      4500.0, // receivedAmount
      4500.0, // requiredAmount
      '0.000000', // remainingAmount
      JSON.stringify({
        securityCheck: 'passed',
        validationReport: {
          paymentId: testPayment.id,
          sufficientAmount: true
        }
      })
    );
    
    console.log(`✓ Payment ${testPayment.id} updated successfully.`);
    console.log(`Payment status: ${updatedPayment.status}`);
    console.log(`Email sent flag: ${updatedPayment.emailSent ? 'TRUE' : 'FALSE'}`);
    console.log(`Transaction hash: ${updatedPayment.transactionHash}`);
    
    // Wait a moment for any async operations to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fetch the payment again to see if the emailSent flag was updated
    const finalPayment = await storage.getPayment(testPayment.id);
    
    if (finalPayment?.emailSent) {
      console.log('✅ TEST PASSED: Payment confirmation email was automatically sent!');
    } else {
      console.log('❌ TEST FAILED: Payment confirmation email was NOT sent.');
      console.log(`Final payment email sent flag: ${finalPayment?.emailSent}`);
    }
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    
    await db.delete(payments).where(eq(payments.id, testPayment.id));
    await db.delete(merchants).where(eq(merchants.id, testMerchant.id));
    
    console.log('✓ Test data cleaned up.');
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testAutomaticEmailSend()
  .then(() => {
    console.log('Test completed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
  });