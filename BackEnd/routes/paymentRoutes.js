import express, { Router } from 'express';
import db from "../config/db.js";
import stripePackage from 'stripe';
// Add this import at the top of your payment router file
import { sendPaymentConfirmation } from '../Services/paymentEmailService.js';

const router = Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Helper function to wrap db.query in a promise
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
};

// Create payment intent
router.post('/payments/create-payment-intent', async (req, res) => {
    try {
      console.log('Received payment intent request:', req.body); // Add logging
      
      const { bookingId, amount, currency = 'usd', customer_email } = req.body;
      
      // Validate required fields
      if (!bookingId || !amount || !customer_email) {
        return res.status(400).json({ 
          error: 'Missing bookingId, amount, or customer_email' 
        });
      }
  
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency,
        metadata: { bookingId },
        receipt_email: customer_email,
        description: `Booking deposit for ${customer_email}`
      });
  
      // Save to database
      await query(
        `INSERT INTO payments 
         (payment_id, booking_id, amount, currency, status)
         VALUES (?, ?, ?, ?, ?)`,
        [
          paymentIntent.id,
          bookingId,
          amount,
          currency,
          'requires_payment_method'
        ]
      );
  
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentId: paymentIntent.id
      });
  
    } catch (err) {
      console.error('Payment error:', err);
      res.status(500).json({ 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  });


// Payment confirmation endpoint
router.post('/confirm', async (req, res) => {
    const { bookingId, paymentId, amountPaid } = req.body;
  
    // Validate input
    if (!bookingId || !paymentId || !amountPaid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    try {
      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: 'Payment not completed' });
      }
  
      // Start transaction
      await query('START TRANSACTION');
  
      // Update booking - FIX: Don't destructure the result
      const updateResult = await query(
        `UPDATE bookings 
         SET payment_status = 'deposit_paid',
             payment_id = ?,
             amount_paid = ?,
             payment_date = NOW(),
             status = 'pending'
         WHERE id = ?`,
        [paymentId, amountPaid, bookingId]
      );
  
      // Check affectedRows property on the result object
      if (updateResult.affectedRows === 0) {
        await query('ROLLBACK');
        return res.status(404).json({ error: 'Booking not found' });
      }
  
      // Update payment record
      await query(
        `UPDATE payments 
         SET status = 'succeeded',
             updated_at = NOW()
         WHERE payment_id = ? AND booking_id = ?`,
        [paymentId, bookingId]
      );
  
      // Commit transaction
      await query('COMMIT');
  
      // Send payment confirmation email
      await sendPaymentConfirmation(bookingId, amountPaid);
  
      res.json({ 
        success: true,
        message: 'Payment confirmed successfully'
      });
  
    } catch (err) {
      await query('ROLLBACK');
      console.error('Payment confirmation error:', err);
      res.status(500).json({ 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  });
  
  // Stripe webhook handler
  router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
  
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        'your_webhook_signing_secret'
      );
    } catch (err) {
      console.error('Webhook error:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await handlePaymentFailure(event.data.object);
          break;
      }
      res.json({ received: true });
    } catch (err) {
      console.error('Webhook processing error:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  async function handlePaymentSuccess(paymentIntent) {
    try {
      await query('START TRANSACTION');
  
      const bookingId = paymentIntent.metadata.bookingId;
      
      // Update payment record
      await query(
        `UPDATE payments 
         SET status = 'succeeded',
             payment_method = ?,
             updated_at = NOW()
         WHERE payment_id = ?`,
        [paymentIntent.payment_method_types[0], paymentIntent.id]
      );
  
      // Update booking
      await query(
        `UPDATE bookings 
         SET payment_status = 'deposit_paid',
             payment_id = ?,
             amount_paid = ?,
             payment_date = NOW(),
             status = 'confirmed'
         WHERE id = ?`,
        [
          paymentIntent.id,
          paymentIntent.amount_received / 100,
          bookingId
        ]
      );
  
      await query('COMMIT');
  
      // Send payment confirmation email
      if (bookingId) {
        await sendPaymentConfirmation(bookingId, paymentIntent.amount_received / 100);
      }
  
    } catch (err) {
      await query('ROLLBACK');
      console.error('Payment success handling error:', err);
      throw err;
    }
  }
  
  async function handlePaymentFailure(paymentIntent) {
    try {
      await query(
        `UPDATE payments 
         SET status = 'failed',
             updated_at = NOW()
         WHERE payment_id = ?`,
        [paymentIntent.id]
      );
  
      const bookingId = paymentIntent.metadata.bookingId;
      if (bookingId) {
        await query(
          `UPDATE bookings 
           SET payment_status = 'unpaid',
               status = 'pending'
           WHERE id = ? AND payment_status = 'unpaid'`,
          [bookingId]
        );
      }
    } catch (err) {
      console.error('Payment failure handling error:', err);
      throw err;
    }
  }
  
  export default router;