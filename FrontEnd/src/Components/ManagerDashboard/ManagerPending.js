import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ManagerPending.css";

import ManagerSidebar from "./ManagerSidebar";

const ManagerPending = () => {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState({
    userId: null,
    villaId: null,
    villaLocation: null,
    fullName: "Manager"
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const villaId = localStorage.getItem("villaId");
    const villaLocation = localStorage.getItem("villaLocation");
    setUserInfo({
      userId: user.id,
      villaId,
      villaLocation,
      fullName: user.fullName || "Manager"
    });
  }, []);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const villaId = userInfo.villaId; // Use villaId instead of villaLocation
      
      if (!villaId) {
        throw new Error('Assigned Villa ID is not available');
      }
      
      const response = await axios.get(`http://localhost:3037/api/frontdesk/pending`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { villaId } // Send villaId instead of villaLocation
      });
      if (response.data.success) {
        setPendingBookings(response.data.data);
        setError(null);
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
    if (userInfo.userId && userInfo.villaLocation) {
      fetchPendingBookings();
      
      const interval = setInterval(fetchPendingBookings, 30000);
      return () => clearInterval(interval);
    }
  }, [userInfo.userId, userInfo.villaLocation]);

  return (
    <div className="Manager-pending-container">
      <ManagerSidebar />
      <div className="Manager-pending-content">
        <div className="Manager-pending-header">
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

export default ManagerPending;
