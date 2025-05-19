import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ManagerCancellation.css";

import ManagerSidebar from "./ManagerSidebar";

const ManagerCancellation = () => {
  const [cancellations, setCancellations] = useState([]);
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

  const fetchCancellations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const villaId = userInfo.villaId; // Use villaId instead of villaLocation
      
      if (!villaId) {
        throw new Error('Assigned Villa ID is not available');
      }
      
      const response = await axios.get(`http://localhost:3037/api/frontdesk/cancellation`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { villaId } // Send villaId instead of villaLocation
      });
      
      if (response.data.success) {
        setCancellations(response.data.data);
        setError(null);
      } else {
        throw new Error(response.data.error || 'Failed to load cancellations');
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
      fetchCancellations();
      
      const interval = setInterval(fetchCancellations, 30000);
      return () => clearInterval(interval);
    }
  }, [userInfo.userId, userInfo.villaLocation]);

  return (
    <div className="Manager-cancellation-container">
      <ManagerSidebar />
      <div className="Manager-cancellation-content">
        <div className="Manager-cancellation-header">
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
                <th>Contact Number</th>
                <th> Reserved Date</th>
                
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
                    <td>{booking.id || "N/A"}</td>
                    <td>{booking.customerName || "N/A"}</td>
                    <td>{booking.contactNumber || "N/A"}</td>
                    <td>{new Date(booking.reservedDate).toLocaleDateString()}</td>
                    
                    <td>{booking.category || "N/A"}</td>
                    <td>
                      <span className="status-badge cancelled">
                        {booking.status || "cancelled"}
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

export default ManagerCancellation;