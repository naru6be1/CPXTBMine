import nodemailer from 'nodemailer';
import { CONTACT_EMAIL, PLATFORM_NAME } from '@shared/constants';

// Determine if we're in development mode
const isDev = process.env.NODE_ENV !== 'production';

// For development, use ethereal.email (fake SMTP service for testing)
let devTransporter: nodemailer.Transporter | null = null;

// Production email transporter
let prodTransporter: nodemailer.Transporter | null = null;

// Initialize the appropriate transporter
export let transporter: nodemailer.Transporter;

// Setup transporters
if (isDev) {
  console.log("Using development email mode - emails will be logged to console");
  
  // For development, we'll create a test account and log the links
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'dev@example.com', // These will be ignored in our dev implementation
      pass: 'password',
    },
  });
} else {
  // For production, use the configured SMTP server
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || CONTACT_EMAIL,
      pass: process.env.EMAIL_PASSWORD || '',
    },
  });
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  username: string
): Promise<boolean> {
  try {
    // Get origin from request or use fallback
    const baseUrl = process.env.BASE_URL || 'https://cpxtb.io';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    // In development mode, just log the reset URL and return success
    if (isDev) {
      console.log('\n==============================================================');
      console.log('DEVELOPMENT MODE: Password Reset Email');
      console.log('==============================================================');
      console.log(`To: ${email}`);
      console.log(`Username: ${username}`);
      console.log(`Reset Token: ${resetToken}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('==============================================================\n');
      return true;
    }
    
    // For production, actually send the email
    console.log(`Sending password reset email to ${email} with reset URL: ${resetUrl}`);
    
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
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    console.error('Email configuration:', {
      host: process.env.EMAIL_HOST || 'not set',
      port: process.env.EMAIL_PORT || 'not set',
      secure: process.env.EMAIL_SECURE || 'not set',
      user: process.env.EMAIL_USER ? '(set)' : '(not set)',
      pass: process.env.EMAIL_PASSWORD ? '(set)' : '(not set)'
    });
    return false;
  }
}