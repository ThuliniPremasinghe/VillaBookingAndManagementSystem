// components/UserProfile.js
// components/UserProfile.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './ManagerUserProfile.css';

import ManagerSidebar from "./ManagerSidebar";

const UserProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    contact_number: '',
    nic: '',
    user_name: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState({
    userId: null,
    villaId: null,
    fullName: "User",
    villaLocation: "",
    userRole: null
  });
  

  useEffect(() => {
    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const villaId = localStorage.getItem("villaId");
    const villaLocation = localStorage.getItem("villaLocation");
   
    
    setUserInfo({
      userId: user.id,
      villaId,
      villaLocation,
      fullName: user.fullName || "User",
      
    });

    // Fetch profile data
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:3037/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching profile');
      }
    };
    
    fetchProfile();
  }, [id]);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:3037/api/users/${id}`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Profile updated successfully');
      setEditMode(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile');
    }
  };

  return (
    <div className="profile-container">
      <ManagerSidebar />
      <div className="profile-content">
        <div className="profile-header">
          <h2>Profile {userInfo.villaLocation && `- ${userInfo.villaLocation}`}</h2>
          <div className="user-info">
            <span className="user-name">{userInfo.fullName}</span>
            
          </div>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="profile-grid">
          {/* Profile Information Section */}
          <div className="profile-section">
            {!editMode ? (
              <div className="profile-view">
                <p><strong>Full Name:</strong> {profile.full_name}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Phone:</strong> {profile.contact_number}</p>
                <p><strong>NIC:</strong> {profile.nic}</p>
                <p><strong>Username:</strong> {profile.user_name}</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setEditMode(true)}
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="full_name"
              value={profile.full_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="contact_number"
              value={profile.contact_number}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>NIC</label>
            <input
              type="text"
              name="nic"
              value={profile.nic}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="user_name"
              value={profile.user_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-actions form-actions-right"> 
          <button type="submit" className="btn btn-success">
            Save Changes
          </button>
          <button
            type="button"
            className="btn btn-secondary ml-2"
            onClick={() => setEditMode(false)}
          >
            Cancel
          </button>
          </div>
          </form>
            )}
          </div>

          {/* Change Password Section - Always Visible */}
          <div className="password-section">
            <h3>Change Password</h3>
            <ChangePassword userId={id} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ChangePassword = ({ userId }) => {
  const [ setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
        const token = localStorage.getItem("token");
        await axios.post(`http://localhost:3037/api/users/${userId}/change-password`, {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Password changed successfully');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Error changing password');
        console.error('Password change error:', err);
      }}

  return (
    <div className="change-password mt-4">
     

     
        <form onSubmit={handleSubmit} className="mt-3">
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          <button type="submit" className="btn btn-primary">
            Update Password
          </button>
        </form>
      
    </div>
  );
};

export default UserProfile;