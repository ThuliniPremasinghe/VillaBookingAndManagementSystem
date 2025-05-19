import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./RegisterForm.css";

const CustomerRegister = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    contact_number: "",
    nic: "",
    user_name: "",
    password: "",
    confirmPassword: "",
    terms_accepted: false,
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (!formData.terms_accepted) {
      alert("You must accept the terms and conditions.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3037/api/auth/register", formData);
      if (response.status === 201) {
        alert("Registration successful!");
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred.");
    }
  };


  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Create Account</h2>
        {error && <p className="error-message">{error}</p>}
        <label>Full Name</label>
        <input type="text" name="full_name" placeholder="Enter Full Name" value={formData.full_name} onChange={handleChange} required />
        <label>Email Address</label>
        <input type="email" name="email" placeholder="Enter Email" value={formData.email} onChange={handleChange} required />
        <label>Contact Number</label>
        <input type="text" name="contact_number" placeholder="Enter Contact Number" value={formData.contact_number} onChange={handleChange} required />
        <label>NIC</label>
        <input type="text" name="nic" placeholder="Enter NIC" value={formData.nic} onChange={handleChange} required />
        <label>Username</label>
        <input type="text" name="user_name" placeholder="Enter Username" value={formData.user_name} onChange={handleChange} required />
        <label>Password</label>
        <input type="password" name="password" placeholder="Enter Password" value={formData.password} onChange={handleChange} required />
        <label>Confirm Password</label>
        <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
        <div className="terms">
          <input type="checkbox" name="terms_accepted" checked={formData.terms_accepted} onChange={handleChange} />
          <span>I have read and agreed to the Terms and Conditions and Privacy Policy</span>
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default CustomerRegister;
