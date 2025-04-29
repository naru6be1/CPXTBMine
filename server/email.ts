import nodemailer from 'nodemailer';
import { CONTACT_EMAIL, PLATFORM_NAME } from '@shared/constants';

// Create a transporter using your domain email credentials
// This will be configured based on the user's actual email service
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com', // Will be replaced with actual SMTP server
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || CONTACT_EMAIL,
    pass: process.env.EMAIL_PASSWORD || '',
  },
});

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  username: string
): Promise<boolean> {
  try {
    const resetUrl = `${process.env.BASE_URL || 'https://cpxtb.io'}/reset-password?token=${resetToken}`;
    
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
    return false;
  }
}