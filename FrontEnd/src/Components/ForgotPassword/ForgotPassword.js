import React, { useState } from "react";
import axios from "axios";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post(
        "http://localhost:3037/api/forgot-password", 
        { email }
      );

      if (response.status === 200) {
        setMessage(response.data.message || "Password reset link sent! Check your email.");
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message || 
        error.response?.data?.error || 
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-form">
        <h2>Forgot Password</h2>
        <p>Enter your email address to receive a password reset link.</p>
        
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="email-input"
          required
        />
        
        <button 
          onClick={handleReset} 
          className="reset-button"
          disabled={loading}
        >
          {loading ? "Sending..." : "Reset Password"}
        </button>
        
        {message && (
          <div className={`message ${message.includes("sent") ? "success" : "error"}`}>
            {message}
          </div>
        )}
        
        <a href="/login" className="back-to-login">
          Back to Login
        </a>
      </div>
    </div>
  );
};

export default ForgotPassword;