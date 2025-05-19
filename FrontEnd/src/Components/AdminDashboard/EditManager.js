import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./AddManagers.css";

const EditManager = ({ fetchStaff }) => {
  const { id } = useParams(); // Get the manager ID from URL params
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
    terms_accepted: true // Default to true for edit form
  });

  const [villas, setVillas] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchManagerAndVillas = async () => {
      try {
        setIsFetching(true);
        
        // Fetch manager data
        const managerResponse = await axios.get(`http://localhost:3037/api/staff/${id}`);
        const managerData = managerResponse.data;
        
        // Fetch villas
        const villasResponse = await axios.get("http://localhost:3037/api/staff/villas/locations");
        setVillas(villasResponse.data);
        
        // Set form data with manager details
        setFormData({
          full_name: managerData.full_name,
          email: managerData.email,
          contact_number: managerData.contact_number,
          nic: managerData.nic,
          user_name: managerData.user_name,
          password: "", // Leave password fields empty for security
          confirmPassword: "",
          role: managerData.role,
          villa_id: managerData.villa_id,
          terms_accepted: true
        });
      } catch (err) {
        console.error("Failed to fetch data", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setIsFetching(false);
      }
    };

    fetchManagerAndVillas();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const validateForm = () => {
    // Only validate password if it's being changed (not empty)
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return false;
    }
    if (formData.password && formData.password.length < 8) {
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
      
      // Prepare data for update - don't send password if not changed
      const updateData = {
        full_name: formData.full_name,
        email: formData.email,
        contact_number: formData.contact_number,
        nic: formData.nic,
        user_name: formData.user_name,
        role: formData.role,
        villa_id: formData.villa_id
      };

      // Only add password fields if they're being changed
      if (formData.password) {
        updateData.password = formData.password;
        updateData.confirmPassword = formData.confirmPassword;
      }

      const response = await axios.put(
        `http://localhost:3037/api/staff/${id}`,
        updateData
      );

      if (response.status === 200) {
        alert("User updated successfully!");
        if (fetchStaff) fetchStaff();
        navigate("/adminstaffmanagement");
      }
    } catch (error) {
      console.error("Error updating manager:", error);
      setError(error.response?.data?.error || "Failed to update manager. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="register-staff-container">Loading manager data...</div>;
  }

  return (
    <div className="register-staff-container">
      <div className="register-staff-form">
        <h2>Edit User</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Contact Number</label>
          <input
            type="tel"
            name="contact_number"
            value={formData.contact_number}
            onChange={handleChange}
            required
          />

          <label>NIC</label>
          <input
            type="text"
            name="nic"
            value={formData.nic}
            onChange={handleChange}
            required
          />

          <label>Assigned Villa</label>
          <select
            name="villa_id"
            value={formData.villa_id}
            onChange={handleChange}
            required
            disabled={isLoading}
          >
            <option value="">Select a Villa</option>
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
            required
          />

          <label>New Password (leave blank to keep current)</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            minLength="8"
            placeholder="Leave blank to keep current password"
          />

          <label>Confirm New Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Leave blank to keep current password"
          />

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Manager"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditManager;