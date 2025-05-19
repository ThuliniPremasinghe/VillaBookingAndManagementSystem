import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AddManagers.css";

const AddManagers = ({ fetchStaff }) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    contact_number: "",
    nic: "",
    user_name: "",
    password: "",
    confirmPassword: "",
    role: "manager",
    villa_id: "",
    terms_accepted: false
  });

  const [villas, setVillas] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVillas = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("http://localhost:3037/api/staff/villas/locations");
        setVillas(response.data);
      } catch (err) {
        console.error("Failed to fetch villa locations", err);
        setError("Failed to load villa locations. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVillas();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return false;
    }
    if (!formData.terms_accepted) {
      setError("You must accept the terms and conditions");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      const response = await axios.post(
        "http://localhost:3037/api/staff/register",
        {
          full_name: formData.full_name,
          email: formData.email,
          contact_number: formData.contact_number,
          nic: formData.nic,
          user_name: formData.user_name,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: formData.role,
          villa_id: formData.villa_id,
          terms_accepted: formData.terms_accepted
        }
      );

      if (response.status === 201) {
        alert("Staff added successfully!");
        if (fetchStaff) fetchStaff();
        navigate("/adminstaffmanagement");
      }
    } catch (error) {
      console.error("Error adding manager:", error);
      setError(error.response?.data?.error || "Failed to add staff. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-staff-container">
      <div className="register-staff-form">
        <h2>Create Account </h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Enter Full Name"
            required
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter Email Address"
            required
          />

          <label>Contact Number</label>
          <input
            type="tel"
            name="contact_number"
            value={formData.contact_number}
            onChange={handleChange}
            placeholder="Enter Contact Number"
            required
          />

          <label>NIC</label>
          <input
            type="text"
            name="nic"
            value={formData.nic}
            onChange={handleChange}
            placeholder="Enter NIC"
            required
          />

<label>Assigned Villa</label>
          <select
            name="villa_id"
            value={formData.villa_id}
            onChange={handleChange}
            required
            disabled={isLoading || villas.length === 0}
          >
            <option value="">{isLoading ? "Loading..." : "Select a Villa"}</option>
            {villas.map(villa => (
              <option key={villa.id} value={villa.id}>
                {villa.villaLocation}
              </option>
            ))}
          </select>

          <label>Role</label>
        <select 
          name="role" 
          value={formData.role} 
          onChange={handleChange} 
          required
        >
          <option value="front_desk">Front Desk Staff</option>
          <option value="manager">Manager</option>
        </select>
        


          <label>Username</label>
          <input
            type="text"
            name="user_name"
            value={formData.user_name}
            onChange={handleChange}
            placeholder="Enter Username"
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter Password"
            required
            minLength="8"
          />

          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Enter Confirm Password"
            required
          />



          


          <div className="terms">
            <input
              type="checkbox"
              id="terms"
              name="terms_accepted"
              checked={formData.terms_accepted}
              onChange={handleChange}
              required
            />
            
          <span>I have read and agreed to the Terms and Conditions and Privacy Policy</span>
       
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Registering..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddManagers;