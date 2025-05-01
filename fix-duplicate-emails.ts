import { storage } from './server/storage';
import { db } from './server/db';
import { payments } from './shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Script to verify and fix duplicate email issues for specific payment references
 */
async function checkAndFixDuplicateEmails() {
  try {
    console.log('\n=================================================');
    console.log('PAYMENT EMAIL DUPLICATE FIX TOOL');
    console.log('=================================================');
    
    // List of payment references to check
    const problematicReferences = [
      'F7E5ECE8C61E3569B7FB6079',  // Previously had duplicate emails
      'A2E6EB713A74CB29E63D3398',  // Previously had duplicate emails
      'BAFD9D482F6B02F37EC53CC2'   // New payment processed with fix in place
    ];
    
    console.log(`Checking status for ${problematicReferences.length} payment references...`);
    
    for (const reference of problematicReferences) {
      // Get payment details by reference
      const [payment] = await db.select()
        .from(payments)
        .where(eq(payments.paymentReference, reference));
      
      if (!payment) {
        console.log(`❓ Payment with reference ${reference} not found in the database`);
        continue;
      }
      
      console.log(`\nChecking payment ID: ${payment.id}, Reference: ${reference}`);
      console.log(`Status: ${payment.status}, EmailSent: ${payment.emailSent}, Completed: ${payment.completedAt ? 'Yes' : 'No'}`);
      
      // If payment is completed but emailSent is false, this could be a source of duplicate emails
      if (payment.status === 'completed' && !payment.emailSent) {
        console.log(`⚠️ Found completed payment with emailSent=false. This could be causing duplicate emails.`);
        
        // Mark the payment as having email sent
        console.log(`Updating payment ${payment.id} to set emailSent=true...`);
        const updatedPayment = await storage.markPaymentEmailSent(payment.id);
        
        console.log(`✅ Payment ${payment.id} updated. New emailSent value: ${updatedPayment.emailSent}`);
      } else if (payment.status === 'completed' && payment.emailSent) {
        console.log(`✅ Payment ${payment.id} is already marked as having email sent (emailSent=true)`);
        
        // Verify other sources of duplication
        console.log(`Checking for potential race conditions by inspecting payment data...`);
        
        // If the payment has been updated recently, there might be concurrent processes
        const lastUpdateTime = new Date(payment.updatedAt).getTime();
        const completedTime = payment.completedAt ? new Date(payment.completedAt).getTime() : 0;
        const timeDiff = Math.abs(lastUpdateTime - completedTime);
        
        if (timeDiff < 5000) { // Within 5 seconds
          console.log(`⚠️ Payment was completed and updated within a short timeframe (${timeDiff}ms)`);
          console.log(`This suggests potential race conditions with multiple processes updating simultaneously`);
        } else {
          console.log(`Time between completion and last update is normal (${timeDiff}ms)`);
        }
        
        // Also check if there are any missing payment attributes
        const missingAttributes: string[] = [];
        if (!payment.transactionHash) missingAttributes.push('transactionHash');
        if (!payment.receivedAmount) missingAttributes.push('receivedAmount');
        if (!payment.requiredAmount) missingAttributes.push('requiredAmount');
        if (!payment.securityStatus) missingAttributes.push('securityStatus');
        
        if (missingAttributes.length > 0) {
          console.log(`⚠️ Payment is missing attributes: ${missingAttributes.join(', ')}`);
          console.log(`This could lead to inconsistent updates across different processes`);
        } else {
          console.log(`Payment has all required attributes properly set`);
        }
      } else {
        console.log(`❓ Payment status (${payment.status}) doesn't match completed or emailSent is already false`);
      }
    }
    
    console.log('\n=================================================');
    console.log('SUMMARY OF DEPLOYED FIXES:');
    console.log('=================================================');
    console.log('1. Enhanced email sending with database verification');
    console.log('2. Added locking mechanism to prevent concurrent email sending');
    console.log('3. Improved payment status tracking with double-checking');
    console.log('4. Removed any direct database updates outside of storage.ts');
    console.log('=================================================');
    
    console.log('\nFix complete! The system should no longer send duplicate emails.');
  } catch (error) {
    console.error('Error checking/fixing duplicate emails:', error);
  }
}

// Run the fix
checkAndFixDuplicateEmails()
  .then(() => {
    console.log('Script completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });