/**
 * PayPal Service for CPXTB token purchases
 * This service handles PayPal payment integration for buying CPXTB tokens
 */

import { Request, Response } from 'express';
import {
  Client,
  Environment,
  LogLevel
} from '@paypal/paypal-server-sdk';

// Configure PayPal client
function getPayPalClient() {
  // Check if PayPal credentials are configured
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    console.warn('PayPal credentials not configured. Required for production use.');
    return null;
  }

  const environment = process.env.NODE_ENV === 'production'
    ? Environment.Production
    : Environment.Sandbox;

  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: process.env.PAYPAL_CLIENT_ID,
      oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET
    },
    timeout: 0,
    environment: environment,
    logging: {
      logLevel: LogLevel.Info,
      logRequest: {
        logBody: true,
      },
      logResponse: {
        logHeaders: true,
      },
    },
  });
}

// This function is used to create a PayPal order for CPXTB token purchase
export async function createTokenPurchaseOrder(req: Request, res: Response) {
  try {
    // Check if PayPal credentials are configured
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.error('PayPal credentials are not configured.');
      return res.status(503).json({
        success: false,
        message: 'PayPal payment service is temporarily unavailable.'
      });
    }

    const { amount, currency = 'USD', cpxtbAmount } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Amount must be a positive number.'
      });
    }

    if (!cpxtbAmount || isNaN(parseFloat(cpxtbAmount)) || parseFloat(cpxtbAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CPXTB amount. Amount must be a positive number.'
      });
    }

    console.log(`Creating PayPal order for $${amount} ${currency} to purchase ${cpxtbAmount} CPXTB tokens`);

    const client = getPayPalClient();
    if (!client) {
      // If we can't create a PayPal client (due to missing credentials), return placeholder for development
      console.warn('Using placeholder PayPal order due to missing credentials');
      return res.status(200).json({
        success: true,
        message: 'PayPal payment flow is ready but not fully configured',
        orderId: 'PLACEHOLDER_ORDER_ID',
        approvalUrl: '#', 
        status: 'CREATED'
      });
    }

    // Create PayPal order request
    const request: OrdersCreateRequest = {
      body: {
        intent: 'CAPTURE',
        purchase_units: [{
          description: `Purchase of ${cpxtbAmount} CPXTB Tokens`,
          amount: {
            currency_code: currency,
            value: amount.toString()
          },
          custom_id: `CPXTB_${cpxtbAmount}`
        }],
        application_context: {
          return_url: `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:3000"}/pay/success`,
          cancel_url: `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:3000"}/pay/cancel`
        }
      }
    };

    try {
      const order = await client.execute(request);
      
      // Find approval URL in links
      const approvalUrl = order.result.links?.find(link => link.rel === 'approve')?.href || '';
      
      return res.status(200).json({
        success: true,
        orderId: order.result.id,
        approvalUrl: approvalUrl,
        status: order.result.status
      });
    } catch (paypalError: any) {
      console.error('PayPal API error:', paypalError);
      return res.status(500).json({
        success: false,
        message: 'PayPal order creation failed',
        error: paypalError.message
      });
    }
  } catch (error: any) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create PayPal order',
      error: error.message
    });
  }
}

// This function is used to capture a completed PayPal payment
export async function captureTokenPayment(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Check if PayPal credentials are configured
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.error('PayPal credentials are not configured.');
      return res.status(503).json({
        success: false,
        message: 'PayPal payment service is temporarily unavailable.'
      });
    }

    console.log(`Capturing PayPal payment for order ${orderId}`);

    const client = getPayPalClient();
    if (!client) {
      // If we can't create a PayPal client (due to missing credentials), return placeholder for development
      console.warn('Using placeholder PayPal capture due to missing credentials');
      return res.status(200).json({
        success: true,
        message: 'PayPal capture flow is ready but not fully configured',
        status: 'COMPLETED',
        orderId,
        paymentId: 'PLACEHOLDER_PAYMENT_ID',
        captureDetails: {
          id: 'PLACEHOLDER_CAPTURE_ID',
          status: 'COMPLETED',
          amount: req.body.amount || '0.00',
          currency: req.body.currency || 'USD'
        }
      });
    }

    const request: OrdersCaptureRequest = {
      order_id: orderId
    };

    try {
      const capture = await client.execute(request);
      
      return res.status(200).json({
        success: true,
        status: capture.result.status,
        orderId: capture.result.id,
        paymentId: capture.result.id,
        captureDetails: {
          id: capture.result.purchase_units?.[0]?.payments?.captures?.[0]?.id || '',
          status: capture.result.status,
          amount: capture.result.purchase_units?.[0]?.amount?.value || '0.00',
          currency: capture.result.purchase_units?.[0]?.amount?.currency_code || 'USD'
        }
      });
    } catch (paypalError: any) {
      console.error('PayPal API error during capture:', paypalError);
      return res.status(500).json({
        success: false,
        message: 'PayPal payment capture failed',
        error: paypalError.message
      });
    }
  } catch (error: any) {
    console.error('Error capturing PayPal payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to capture PayPal payment',
      error: error.message
    });
  }
}

// This function processes the token purchase after payment is completed
export async function processTokenPurchase(req: Request, res: Response) {
  try {
    const { orderId, walletAddress, amount, cpxtbAmount } = req.body;
    
    if (!orderId || !walletAddress || !amount || !cpxtbAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, walletAddress, amount, cpxtbAmount'
      });
    }

    // Validate wallet address format
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address format'
      });
    }

    // Here we would:
    // 1. Verify the PayPal payment is successful (already captured)
    // 2. Update the user's CPXTB balance
    // 3. Record the transaction in our database
    
    console.log(`Processing token purchase: ${cpxtbAmount} CPXTB for wallet ${walletAddress}`);
    
    // This is where we would integrate with the blockchain to transfer tokens
    // For now, we're just simulating a successful transaction
    
    // In production, we would:
    // 1. Call the smart contract to transfer tokens
    // 2. Wait for transaction confirmation
    // 3. Update the database with transaction details
    
    return res.status(200).json({
      success: true,
      message: 'Token purchase successful',
      transaction: {
        id: `tx_${Date.now()}`,
        walletAddress,
        cpxtbAmount: parseFloat(cpxtbAmount),
        fiatAmount: parseFloat(amount),
        fiatCurrency: 'USD',
        timestamp: new Date().toISOString(),
        status: 'completed'
      }
    });
  } catch (error: any) {
    console.error('Error processing token purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process token purchase',
      error: error.message
    });
  }
}