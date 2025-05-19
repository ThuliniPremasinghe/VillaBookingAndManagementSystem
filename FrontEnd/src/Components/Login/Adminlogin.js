import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

const AdminLogin = () => {
  const [formData, setFormData] = useState({ user_name: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.user_name || !formData.password) {
      setError("Username and password are required.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3037/api/admin/login", formData); // Admin endpoint
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      alert("Admin login successful!");
      navigate("/adminDashboard");
    } catch (error) {
      setError(error.response?.data?.message || "Invalid login credentials.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Admin Login</h2>
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
            />
          </div>
          <div className="options">
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/forgotpassword" className="forgot-password">Forgot password?</Link>
          </div>
          <button type="submit" className="login-btn">Login</button>
        </form>
        <p className="register">
          Don’t have an account? <Link to="/register">Register Now</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
