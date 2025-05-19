import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";


const Login = () => {
    const [formData, setFormData] = useState({ 
        user_name: "", 
        password: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        
        if (!formData.user_name || !formData.password) {
            setError("Username and password are required.");
            setLoading(false);
            return;
        }
    
        try {
            const response = await axios.post(
                "http://localhost:3037/api/login",
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Handle password reset requirement
            if (response.data.requiresPasswordReset) {
                localStorage.setItem('tempToken', response.data.tempToken);
                navigate(`/reset-password?role=${response.data.role}`);
                return;
            }
    
            const { token, user } = response.data;
            
            // Store all user data in localStorage
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("userId", user.id);
            
            // Store villa-specific information if available
            if (user.villaId) {
                localStorage.setItem("villaId", user.villaId);
                localStorage.setItem("villaLocation", user.villaLocation || "");
            }
            
            // Redirect based on role
            switch(user.role) {
                case 'admin':
                    navigate(`/admindashboard/${user.id}`);
                    break;
                    
                case 'manager':
                    navigate(`/managerdashboard/${user.id}`, {
                        state: {
                            villaId: user.villaId,
                            villaLocation: user.villaLocation
                        }
                    });
                    break;
                    
                case 'front_desk':
                    navigate(`/frontdeskdashboard/${user.id}`, {
                        state: {
                            villaId: user.villaId,
                            villaLocation: user.villaLocation
                        }
                    });
                    break;
                    
                case 'customer':
                    navigate(`/homepage/${user.id}`);
                    break;
                    
                default:
                    navigate(`/homepage/${user.id}`);
                    break;
            }
        } catch (error) {
            console.error("Login error:", error);
            setError(error.response?.data?.error || "Login failed. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <h2>Login</h2>
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="user_name"
                            placeholder="Enter Username"
                            value={formData.user_name}
                            onChange={handleChange}
                            required
                            autoComplete="username"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Enter Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <div className="options">
                        <label className="remember-me">
                            <input type="checkbox" /> Remember me
                        </label>
                        <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
                    </div>
                    <button 
                        type="submit" 
                        className="login-btn"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="register">
                    Don't have an account? <Link to="/register">Register Now</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
