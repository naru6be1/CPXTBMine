import nodemailer from 'nodemailer';
import { CONTACT_EMAIL, PLATFORM_NAME } from '@shared/constants';

// Determine if we're in development mode
const isDev = process.env.NODE_ENV !== 'production';

// Initialize the transporter variable
export let transporter: nodemailer.Transporter;

// Set up a function to create the transporter
async function createTransporter() {
  if (isDev) {
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
    console.log("Using production email configuration");
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
  const baseUrl = process.env.BASE_URL || 'https://cpxtb.io';
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
  if (isDev) {
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
    if (info.messageId && isDev && info.previewURL) {
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
    if (isDev) {
      console.log('DEVELOPMENT MODE: Email sending failed, but returning success for testing purposes.');
      console.log('Use the URL printed above to test password reset.');
      return true;
    }
    
    return false;
  }
}