import { useLocation,useNavigate  } from 'react-router-dom';
import Payment from './Payment';
import './CheckoutPage.css';
import React, { useState } from 'react';
import axios from 'axios';
import { AiOutlineCheckCircle } from "react-icons/ai";

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    bookingId, 
    amount, 
    totalAmount,
    customerEmail
  } = location.state || {};
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Add validation for amounts
  if (!bookingId || !amount || !totalAmount) {
    return (
      <div className="checkout-page">
        <h1 className="checkout-title">Checkout Error</h1>
        <div className="error-message">
          Missing booking information. Please start your booking again.
        </div>
      </div>
    );
  }

  const handlePaymentSuccess = async (paymentIntent) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3037/api/confirm', {
        bookingId,
        paymentId: paymentIntent.id,
        amountPaid: amount
      });
      
      if (response.data.success) {
        setPaymentCompleted(true);
      } else {
        setError(response.data.message || "Payment confirmation failed");
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
      setError(err.response?.data?.message || "Error confirming payment");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/homepage'); // Navigates to the home page
  };


  return (
    <div className="checkout-page">
      {error && <div className="error-message">{error}</div>}
      
      {!paymentCompleted ? (
        <Payment 
          amount={amount} 
          bookingId={bookingId}
          customerEmail={customerEmail}
          onSuccess={handlePaymentSuccess}
          totalAmount={totalAmount}
          disabled={loading}
        />
      ) : (
        <div className="payment-success">
          <h2>Payment Successful!</h2>
          <AiOutlineCheckCircle className="success-icon" />
          <h4>Thank you for your booking</h4>
          <p>Your deposit of $ {amount.toLocaleString()} has been received</p>
          <p>A confirmation has been sent to your email</p>

          <button 
            type="submit" 
            className="login-btn"
            onClick={handleBackToHome}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Back to Home'}
          </button>
        </div>
        
      )}
    </div>
  );
};

export default CheckoutPage;