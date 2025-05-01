import nodemailer from 'nodemailer';
import { CONTACT_EMAIL, PLATFORM_NAME } from '@shared/constants';
import { Payment, Merchant } from '@shared/schema';
import { storage } from './storage';

// Determine if we're in development mode
const isDev = process.env.NODE_ENV !== 'production';

// Determine if we have email configuration, which means we should use production email mode
// even if the application is in development mode
const hasEmailConfig = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;

// For email purposes, we're in dev mode only if we're in dev AND have no email config
const isEmailDevMode = isDev && !hasEmailConfig;

// Initialize the transporter variable
export let transporter: nodemailer.Transporter;

// Set up a function to create the transporter
async function createTransporter() {
  if (isEmailDevMode) {
    console.log("Using development email mode - emails will be logged to console");
    
    try {
      // Create a test account on Ethereal for development testing
      const testAccount = await nodemailer.createTestAccount();
      console.log("Created test email account:", testAccount.user);
      
      // Create the development transporter with the test account
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (error) {
      console.error("Failed to create test email account:", error);
      
      // Fallback if test account creation fails
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'test@ethereal.email',
          pass: 'password',
        },
        // This makes it just log without attempting delivery
        logger: true,
        debug: true,
      });
    }
  } else {
    // For production, use the configured SMTP server
    console.log("Using production email configuration with:", {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 3) + '...' : 'not set',
        pass: process.env.EMAIL_PASSWORD ? '********' : 'not set',
      }
    });
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.example.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || CONTACT_EMAIL,
        pass: process.env.EMAIL_PASSWORD || '',
      },
    });
  }
}

// Initialize the transporter
createTransporter().then(t => {
  transporter = t;
  // Verify transporter connection
  transporter.verify((error, success) => {
    if (error) {
      console.error("SMTP connection error:", error);
    } else {
      console.log("SMTP server is ready to send messages:", success);
    }
  });
}).catch(err => {
  console.error("Failed to create email transporter:", err);
});

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  username: string
): Promise<boolean> {
  // Get origin from request or use fallback
  const baseUrl = process.env.BASE_URL || 'https://cpxtbmining.com';
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  
  // Always log the reset URL for debugging purposes
  console.log('\n==============================================================');
  console.log(`PASSWORD RESET REQUEST for ${username}`);
  console.log('==============================================================');
  console.log(`To: ${email}`);
  console.log(`Reset Token: ${resetToken}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log('==============================================================\n');
  
  // In development mode, just log the information and return success
  // This way we can always test the reset functionality even if email isn't working
  if (isEmailDevMode) {
    console.log('DEVELOPMENT MODE: Not sending actual email. Use the URL above to test.');
    return true;
  }
  
  // For production, try to send the email
  try {
    // Make sure the transporter exists
    if (!transporter) {
      console.warn('Email transporter not initialized. Creating a new one...');
      transporter = await createTransporter();
    }
    
    console.log(`Sending password reset email to ${email}...`);
    
    const mailOptions = {
      from: `"${PLATFORM_NAME}" <${CONTACT_EMAIL}>`,
      to: email,
      subject: `${PLATFORM_NAME} - Password Reset Request`,
      text: 
`Hello ${username},

We received a request to reset your password for your ${PLATFORM_NAME} account. 

Please click on the following link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email or contact support if you have concerns.

Thanks,
The ${PLATFORM_NAME} Team`,
      html: 
`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #3b82f6; padding: 20px; text-align: center; color: white;">
    <h1>${PLATFORM_NAME}</h1>
  </div>
  <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
    <p>Hello <strong>${username}</strong>,</p>
    <p>We received a request to reset your password for your ${PLATFORM_NAME} account.</p>
    <p>Please click on the button below to reset your password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
    </div>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
    <p>Thanks,<br>The ${PLATFORM_NAME} Team</p>
  </div>
  <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
    <p>© ${new Date().getFullYear()} ${PLATFORM_NAME}. All rights reserved.</p>
  </div>
</div>`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    
    // For Ethereal email in development, provide the preview URL
    if (info.messageId && isEmailDevMode && info.previewURL) {
      console.log('Preview URL:', info.previewURL);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    console.error('Email configuration:', {
      host: process.env.EMAIL_HOST || 'not set',
      port: process.env.EMAIL_PORT || 'not set',
      secure: process.env.EMAIL_SECURE || 'not set',
      user: process.env.EMAIL_USER ? '(set)' : '(not set)',
      pass: process.env.EMAIL_PASSWORD ? '(set)' : '(not set)',
      baseUrl: baseUrl
    });
    
    // If in development, still consider this a success so testing can continue
    if (isEmailDevMode) {
      console.log('DEVELOPMENT MODE: Email sending failed, but returning success for testing purposes.');
      console.log('Use the URL printed above to test password reset.');
      return true;
    }
    
    return false;
  }
}

/**
 * Send a payment confirmation email to a merchant
 */
export async function sendPaymentConfirmationEmail(
  merchant: Merchant,
  payment: Payment
): Promise<boolean> {
  // ENHANCED: Double-check that email hasn't been sent by directly querying the database
  // This ensures we have the latest emailSent status even if there are concurrency issues
  const { db } = await import('./db');
  const { payments } = await import('@shared/schema');
  const { eq } = await import('drizzle-orm');
  
  try {
    // Get the latest payment status directly from the database
    const [latestPayment] = await db.select()
      .from(payments)
      .where(eq(payments.id, payment.id));
    
    // If emailSent is true in either the parameter or the DB, skip sending
    if (payment.emailSent || (latestPayment && latestPayment.emailSent)) {
      console.log(`Email already sent for payment ${payment.id}, skipping (verified from DB)`);
      return true;
    }
    
    console.log(`Payment ${payment.id} email status verified as not sent yet, proceeding...`);
  } catch (dbError) {
    console.warn(`Error checking latest payment status for ${payment.id}, using provided status:`, dbError);
    // Fall back to the provided payment object if DB query fails
    if (payment.emailSent) {
      console.log(`Email already sent for payment ${payment.id}, skipping (from parameter)`);
      return true;
    }
  }

  // Get the merchant's email
  const email = merchant.contactEmail;
  const businessName = merchant.businessName;
  const baseUrl = process.env.BASE_URL || 'https://cpxtbmining.com';
  const merchantDashboardUrl = `${baseUrl}/merchant`;
  
  // Format the payment amount with proper decimal places
  const amountCpxtb = parseFloat(payment.amountCpxtb.toString()).toFixed(8);
  const amountUsd = parseFloat(payment.amountUsd.toString()).toFixed(2);
  
  // Format the payment date
  const paymentDate = payment.completedAt 
    ? new Date(payment.completedAt).toLocaleString()
    : new Date().toLocaleString();
  
  // Generate transaction explorer URL
  const txExplorerUrl = payment.transactionHash 
    ? `https://basescan.org/tx/${payment.transactionHash}`
    : '';
  
  // Always log the payment details for debugging purposes
  console.log('\n==============================================================');
  console.log(`PAYMENT CONFIRMATION for ${businessName}`);
  console.log('==============================================================');
  console.log(`To: ${email}`);
  console.log(`Payment Reference: ${payment.paymentReference}`);
  console.log(`Amount: ${amountCpxtb} CPXTB (${amountUsd} USD)`);
  console.log(`Transaction Hash: ${payment.transactionHash || 'N/A'}`);
  console.log(`Payment Date: ${paymentDate}`);
  console.log('==============================================================\n');
  
  // In development mode, just log the information and return success
  if (isEmailDevMode) {
    console.log('DEVELOPMENT MODE: Not sending actual payment confirmation email.');
    return true;
  }
  
  // For production, try to send the email
  try {
    // Make sure the transporter exists
    if (!transporter) {
      console.warn('Email transporter not initialized. Creating a new one...');
      transporter = await createTransporter();
    }
    
    console.log(`Sending payment confirmation email to ${email}...`);
    
    const mailOptions = {
      from: `"${PLATFORM_NAME}" <${CONTACT_EMAIL}>`,
      to: email,
      subject: `${PLATFORM_NAME} - Payment Confirmation`,
      text: 
`Hello ${businessName},

We're pleased to inform you that a payment has been successfully processed.

Payment Details:
- Payment Reference: ${payment.paymentReference}
- Order ID: ${payment.orderId || 'N/A'}
- Amount: ${amountCpxtb} CPXTB (${amountUsd} USD)
- Date: ${paymentDate}
- Transaction Hash: ${payment.transactionHash || 'N/A'}
${txExplorerUrl ? `- Transaction Link: ${txExplorerUrl}` : ''}

You can view detailed information about this payment in your merchant dashboard:
${merchantDashboardUrl}

Thank you for using ${PLATFORM_NAME} for your cryptocurrency payment processing.

Best regards,
The ${PLATFORM_NAME} Team`,
      html: 
`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #3b82f6; padding: 20px; text-align: center; color: white;">
    <h1>${PLATFORM_NAME}</h1>
  </div>
  <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
    <p>Hello <strong>${businessName}</strong>,</p>
    <p>We're pleased to inform you that a payment has been successfully processed.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h2 style="margin-top: 0; font-size: 18px; color: #0f172a;">Payment Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Payment Reference:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${payment.paymentReference}</td>
        </tr>
        ${payment.orderId ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Order ID:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${payment.orderId}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Amount:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${amountCpxtb} CPXTB (${amountUsd} USD)</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Date:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${paymentDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Transaction Hash:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500; word-break: break-all;">
            ${payment.transactionHash || 'N/A'}
          </td>
        </tr>
      </table>
      ${txExplorerUrl ? `
      <div style="margin-top: 16px; text-align: center;">
        <a href="${txExplorerUrl}" target="_blank" style="background-color: #334155; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 14px;">
          View Transaction on BaseScan
        </a>
      </div>
      ` : ''}
    </div>
    
    <p>You can view detailed information about this payment in your merchant dashboard:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${merchantDashboardUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        View Merchant Dashboard
      </a>
    </div>
    
    <p>Thank you for using ${PLATFORM_NAME} for your cryptocurrency payment processing.</p>
    <p>Best regards,<br>The ${PLATFORM_NAME} Team</p>
  </div>
  <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
    <p>© ${new Date().getFullYear()} ${PLATFORM_NAME}. All rights reserved.</p>
  </div>
</div>`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Payment confirmation email sent:', info.messageId);
    
    // For Ethereal email in development, provide the preview URL
    if (info.messageId && isEmailDevMode && info.previewURL) {
      console.log('Preview URL:', info.previewURL);
    }
    
    // Update the payment record to mark email as sent
    try {
      // Use the storage method to mark the email as sent
      await storage.markPaymentEmailSent(payment.id);
      console.log(`✓ Payment ${payment.id} marked as having email sent in database`);
    } catch (dbError) {
      console.error(`Error updating emailSent flag for payment ${payment.id}:`, dbError);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    console.error('Email configuration:', {
      host: process.env.EMAIL_HOST || 'not set',
      port: process.env.EMAIL_PORT || 'not set',
      secure: process.env.EMAIL_SECURE || 'not set',
      user: process.env.EMAIL_USER ? '(set)' : '(not set)',
      pass: process.env.EMAIL_PASSWORD ? '(set)' : '(not set)',
    });
    
    // If in development, still consider this a success so testing can continue
    if (isEmailDevMode) {
      console.log('DEVELOPMENT MODE: Payment confirmation email sending failed, but returning success for testing purposes.');
      return true;
    }
    
    return false;
  }
}