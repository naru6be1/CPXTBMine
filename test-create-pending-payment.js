// Simple script to create a pending payment for testing
import { Pool, neonConfig } from '@neondatabase/serverless';
import { createHash } from 'crypto';
import * as dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();
neonConfig.webSocketConstructor = ws;

async function createTestPendingPayment() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Generate a unique payment reference
    const timestamp = Date.now();
    const hash = createHash('sha256').update(`payment-${timestamp}`).digest('hex');
    const paymentReference = `PAY-${hash.substring(0, 8)}-${timestamp}`;

    // Create a payment that's set to expire 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Create a new pending payment
    const result = await pool.query(
      `INSERT INTO payments (
        merchant_id, 
        payment_reference, 
        amount_usd, 
        amount_cpxtb, 
        status, 
        created_at, 
        updated_at, 
        expires_at,
        success_url,
        exchange_rate,
        required_amount,
        received_amount,
        remaining_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        1,                  // merchant_id (using ID 1 for testing)
        paymentReference,   // payment_reference
        '10.00',            // amount_usd (10 USD)
        '25.00',            // amount_cpxtb (25 CPXTB equivalent)
        'pending',          // status
        new Date(),         // created_at
        new Date(),         // updated_at
        expiresAt,          // expires_at
        'https://example.com/success',  // success_url
        '2.50',             // exchange_rate (1 USD = 2.5 CPXTB)
        '25.00',            // required_amount (amount in CPXTB)
        '0.00',             // received_amount (none received yet)
        '25.00'             // remaining_amount (full amount remaining)
      ]
    );

    console.log('Created test pending payment:', result.rows[0]);
    console.log(`
IMPORTANT: Use this payment reference for testing: ${paymentReference}
Payment will expire at: ${expiresAt.toISOString()}
    `);

    // Now query to verify it shows up in pending payments
    const pendingPayments = await pool.query(
      `SELECT * FROM payments 
       WHERE status = 'pending' AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 5`
    );

    console.log(`\nFound ${pendingPayments.rows.length} pending payments:`);
    pendingPayments.rows.forEach(payment => {
      console.log(`- ID: ${payment.id}, Reference: ${payment.payment_reference}, Status: ${payment.status}, Expires: ${payment.expires_at}`);
    });

  } catch (error) {
    console.error('Error creating test payment:', error);
  } finally {
    await pool.end();
  }
}

createTestPendingPayment();