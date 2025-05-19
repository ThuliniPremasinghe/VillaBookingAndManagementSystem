import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./FrontdeskCancellation.css";

import FrontDeskSidebar from "./FrontDeskSidebar";

const FrontdeskCancellation = () => {
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState({
    userId: null,
    villaId: null,
    fullName: "User",
    villaLocation: ""
  });

  useEffect(() => {
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

  const fetchCancellations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const { villaId } = userInfo;
      
      if (!villaId) {
        throw new Error('Villa assignment not found');
      }
      
      const response = await axios.get(
        `http://localhost:3037/api/frontdesk/cancellation?villaId=${villaId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setCancellations(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to load cancellations');
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    if (userInfo.villaId) {
      fetchCancellations();
    }
  }, [userInfo.villaId, fetchCancellations]);

  return (
    <div className="frontdesk-cancellation-container">
      <FrontDeskSidebar />
      <div className="frontdesk-cancellation-content">
        <div className="frontdesk-cancellation-header">
          <h2>Cancelled Bookings {userInfo.villaLocation && `- ${userInfo.villaLocation}`}</h2>
          <div className="user-info">
            <span className="user-name">{userInfo.fullName}</span>
            
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="table-responsive">
          <table className="cancellation-table">
            <thead>
              <tr>
              <th>ID</th>
                <th>Guest Name</th>
                <th>Contact</th>
                <th>Reserved Date</th>
                <th>Category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="loading-text">Loading cancellations...</td>
                </tr>
              ) : cancellations.length > 0 ? (
                cancellations.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.id}</td>
                    <td>{booking.customerName || "N/A"}</td>
                    <td>{booking.contactNumber || "N/A"}</td>
                    <td>{booking.reservedDate ? new Date(booking.reservedDate).toLocaleDateString() : "N/A"}</td>
                    
                    <td>{booking.category || booking.category}</td>
                    <td>
                      <span className="status-badge cancelled">
                        Cancelled
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">No cancellations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FrontdeskCancellation;