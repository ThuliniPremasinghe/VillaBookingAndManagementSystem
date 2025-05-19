import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ManagerCheckin.css";

import ManagerSidebar from "./ManagerSidebar";

const ManagerCheckin = () => {
  const [checkins, setCheckins] = useState([]);
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


  const fetchCheckins = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const villaId = userInfo.villaId; // Use villaId instead of villaLocation
      
      if (!villaId) {
        throw new Error('Assigned Villa ID is not available');
      }
      
      const response = await axios.get(`http://localhost:3037/api/frontdesk/checkin`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { villaId } // Send villaId instead of villaLocation
      });
      
      if (response.data.success) {
        setCheckins(response.data.data);
        setError(null);
      } else {
        throw new Error(response.data.error || 'Failed to load check-ins');
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
      fetchCheckins();
      
      const interval = setInterval(fetchCheckins, 30000);
      return () => clearInterval(interval);
    }
  }, [userInfo.userId, userInfo.villaLocation]);

  return (
    <div className="Manager-check-in-container">
      <ManagerSidebar />
      <div className="Manager-check-in-content">
        <div className="Manager-check-in-header">
          <h2>Check In {userInfo.villaLocation && `- ${userInfo.villaLocation}`}</h2>
          <div className="user-info">
            <span className="user-name">{userInfo.fullName}</span>
            
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="table-responsive">
          <table className="check-in-table">
            <thead>
              <tr>
              <th>ID</th>
              <th>Guest Name</th>
                <th>Category</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Status</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="loading-text">Loading check-ins...</td>
                </tr>
              ) : checkins.length > 0 ? (
                checkins.map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking._id || "N/A"}</td>
                    <td>{booking.customerName || "N/A"}</td>
                    <td>{booking.category || "N/A"}</td>
                    <td>{new Date(booking.checkInDate).toLocaleDateString()}</td>
                    <td>{new Date(booking.checkOutDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${booking.status.toLowerCase()}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>${booking.totalAmount.toFixed(2)}</td>
                    <td>${booking.amountPaid.toFixed(2)}</td>
                    <td className={booking.balanceDue > 0 ? 'balance-due' : 'balance-paid'}>
                      ${booking.balanceDue.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">No check-ins found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerCheckin;
