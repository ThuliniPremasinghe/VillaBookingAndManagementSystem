import React, { useState, useEffect } from "react";
import axios from "axios";
import "./FrontdeskPending.css";

import FrontDeskSidebar from "./FrontDeskSidebar";

const FrontdeskPending = () => {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState({
    userId: null,
    villaId: null,
    fullName: "User",
    villaLocation: ""
  });

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const { villaId } = userInfo;
      
      if (!villaId) {
        throw new Error('Villa assignment not found');
      }
      
      const response = await axios.get(
        `http://localhost:3037/api/frontdesk/pending?villaId=${villaId}`, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setPendingBookings(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to load bookings');
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const villaId = localStorage.getItem("villaId");
    const villaLocation = localStorage.getItem("villaLocation");
    
    setUserInfo({
      userId: user.id,
      villaId,
      villaLocation,
      fullName: user.fullName || "User"
    });
  }, []);

  useEffect(() => {
    if (userInfo.villaId) {
      fetchPendingBookings();
    }
  }, [userInfo.villaId]);

  const handleProcessBooking = async (id, action) => {
    try {
      const token = localStorage.getItem("token");
      const { villaId } = userInfo;
      
      if (!villaId) {
        throw new Error('Villa assignment not found');
      }
      
      // First get the booking to determine property type
      const booking = pendingBookings.find(b => b.id === id);
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      const response = await axios.put(
        `http://localhost:3037/api/frontdesk/pending/${id}`,
        { 
          action, 
          propertyId: booking.propertyId, 
          propertyType: booking.propertyType 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        fetchPendingBookings();
        alert(`Booking ${action === 'checkin' ? 'checked in' : 'cancelled'} successfully`);
      } else {
        throw new Error(response.data.error || `Failed to ${action} booking`);
      }
    } catch (error) {
      console.error(`Error ${action} booking:`, error);
      alert(error.response?.data?.error || error.message || `Failed to ${action} booking`);
    }
  };

  return (
    <div className="frontdesk-pending-container">
      <FrontDeskSidebar />
      <div className="frontdesk-pending-content">
        <div className="frontdesk-pending-header">
          <h2>Pending Bookings {userInfo.villaLocation && `- ${userInfo.villaLocation}`}</h2>
          <div className="user-info">
            <span className="user-name">{userInfo.fullName}</span>
            
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="table-responsive">
          <table className="pending-bookings-table">
            <thead>
              <tr>
              <th> ID</th>
                <th>Guest Name</th>
                <th>Contact</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="loading-text">Loading pending bookings...</td>
                </tr>
              ) : pendingBookings.length > 0 ? (
                pendingBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.id}</td>
                    <td>{booking.guest_name}</td>
                    <td>{booking.contact_number || "N/A"}</td>
                    <td>{new Date(booking.check_in_date).toLocaleDateString()}</td>
                    <td>{new Date(booking.check_out_date).toLocaleDateString()}</td>
                    <td>{booking.propertyType || booking.propertyType}</td>
                    <td>
                      <span className={`status-badge ${booking.status.toLowerCase()}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="action-buttons">
                      <button 
                        className="checkin-btn"
                        onClick={() => handleProcessBooking(booking.id, 'checkin')}
                      >
                        Check-In
                      </button>
                      <button 
                        className="cancel-btn"
                        onClick={() => handleProcessBooking(booking.id, 'cancel')}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">No pending bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FrontdeskPending;