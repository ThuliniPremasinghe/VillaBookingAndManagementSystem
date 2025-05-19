import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import "./ResetPassword.css";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must be at least 8 characters with one uppercase letter and one number');
      return;
    }

    try {
      const tempToken = localStorage.getItem('tempToken');
      const payload = {
        newPassword,
        ...(tempToken ? { tempToken } : { token })
      };

      const response = await axios.post(
        'http://localhost:3037/api/reset-password', 
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.message) {
        setSuccess(true);
        
        if (tempToken) {
          // First-time login flow
          localStorage.removeItem('tempToken');
          const userRole = response.data.role;
          const userId = JSON.parse(localStorage.getItem('user'))?.id;
          const villaId = response.data.villaId;

          setTimeout(() => {
            let redirectPath = '/dashboard';
            
            switch(userRole) {
              case 'admin':
                redirectPath = `/admindashboard/${userId}`;
                break;
              case 'manager':
                redirectPath = `/managerdashboard/${userId}${villaId ? `?villa=${villaId}` : ''}`;
                break;
              case 'front_desk':
                redirectPath = `/frontdeskdashboard/${userId}${villaId ? `?villa=${villaId}` : ''}`;
                break;
              case 'customer':
                redirectPath = `/homepage/${userId}`;
                break;
              default:
                redirectPath = `/homepage/${userId}`;
                break;
            }
            
            navigate(redirectPath);
          }, 2000);
        } else {
          // Forgot password flow
          setTimeout(() => navigate('/login'), 2000);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed. Please try again.');
      console.error('Reset error:', err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Reset Password</h2>
        {error && <div className="error-message">{error}</div>}
        {success ? (
          <div className="success-message">
            Password reset successfully! Redirecting...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength="8"
              />
              <div className="password-requirements">
                Must be at least 8 characters with one uppercase letter and one number
              </div>
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="submit-btn">
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};


export default ResetPassword;