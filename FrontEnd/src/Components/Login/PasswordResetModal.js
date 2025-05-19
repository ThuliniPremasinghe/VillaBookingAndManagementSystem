import React, { useState } from 'react';
import axios from 'axios';

const PasswordResetModal = ({ token, role, onSuccess, onClose }) => {
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    // Basic password strength validation
    if (passwords.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await axios.post('http://localhost:3037/api/auth/reset-password', {
        tempToken: token,
        newPassword: passwords.newPassword
      });
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || "Password reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleTitle = () => {
    switch(role) {
      case 'admin': return 'Admin';
      case 'manager': return 'Manager';
      case 'front_desk': return 'Staff';
      default: return 'User';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{getRoleTitle()} Password Reset</h3>
        <p>For security reasons, you must set a new password.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              placeholder="At least 8 characters"
              value={passwords.newPassword}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your new password"
              value={passwords.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button 
              type="button" 
              className="secondary-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="primary-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordResetModal;