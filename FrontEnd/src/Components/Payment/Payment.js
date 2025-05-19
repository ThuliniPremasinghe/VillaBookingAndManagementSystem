import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';
import './Payment.css';

const stripePromise = loadStripe('pk_test_51RHnzFPxOCCyCO7qZvL3EHqW9GBEsX0ET9dgCk1mm0qkMFaOvcyUcDaVKpWGbOKlT5cPfjTFoFIlyjgfd4Bkrfrh005MAhQNTM');

const elementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  }
};

const CheckoutForm = ({ 
  amount = 0, 
  bookingId, 
  customerEmail, 
  onSuccess,
  totalAmount = 0 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  const formattedAmount = amount?.toLocaleString?.() || '0';
  const formattedTotalAmount = totalAmount?.toLocaleString?.() || '0';

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      setError('Payment system is still loading. Please wait...');
      return;
    }
  
    setProcessing(true);
    setError(null);
  
    try {
      const response = await fetch('http://localhost:3037/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          bookingId: bookingId,
          amount: Math.round(amount * 100),
          currency: 'usd',
          customer_email: customerEmail
        }),
        
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Payment failed: ${response.status}`);
      }
  
      const { clientSecret } = await response.json();
      
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardNumberElement),
            billing_details: {
              email: customerEmail,
            }
          }
        }
      );
  
      if (stripeError) {
        throw stripeError;
      }
  
      onSuccess(paymentIntent);
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="unified-payment-container">
      <form onSubmit={handleSubmit} className="payment-form">
        <h2 className="payment-header">Complete Your Payment</h2>
        
        <div className="payment-summary">
          <h3 className="summary-title">Payment Summary</h3>
          <div className="summary-item">
            <span>Total Amount:</span>
            <span className="amount">${formattedTotalAmount}</span>
          </div>
          <div className="summary-item highlight">
            <span>Deposit (30%):</span>
            <span className="amount">${formattedAmount}</span>
          </div>
        </div>

        <div className="payment-details">
          <h3 className="payment-details-title">Payment Details</h3>
          
          <div className="payment-details-group">
            <label>Card Number</label>
            <div className="card-input">
              <CardNumberElement options={elementOptions} />
            </div>
          </div>
          
          <div className="form-row">
            <div className="payment-details-group">
              <label>Expiration (MM/YY)</label>
              <div className="card-input">
                <CardExpiryElement options={elementOptions} />
              </div>
            </div>
            
            <div className="payment-details-group">
              <label>CVC</label>
              <div className="card-input">
                <CardCvcElement options={elementOptions} />
              </div>
            </div>
          </div>
        </div>

        <div className="payment-footer">
          
          
          {error && <div className="payment-error">{error}</div>}
          
          <button 
            type="submit" 
            disabled={!stripe || processing}
            className="submit-button"
          >
            {processing ? 'Processing...' : `Pay $${formattedAmount} Now`}
          </button>
          
          <div className="booking-notice">
            <p>Your booking will be confirmed once payment is received.</p>
            <p>The remaining balance will be due at check-in.</p>
          </div>
        </div>
      </form>
    </div>
  );
};

const Payment = ({ amount, bookingId, customerEmail, onSuccess, totalAmount }) => (
  <Elements stripe={stripePromise}>
    <CheckoutForm 
      amount={amount} 
      bookingId={bookingId}
      customerEmail={customerEmail}
      onSuccess={onSuccess}
      totalAmount={totalAmount}
    />
  </Elements>
);

export default Payment;