import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./FrontdeskCheckin.css";

import FrontDeskSidebar from "./FrontDeskSidebar";

const FrontdeskCheckin = () => {
  const [checkins, setCheckins] = useState([]);
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

  const fetchCheckins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const { villaId } = userInfo;
      
      if (!villaId) {
        throw new Error('Villa assignment not found');
      }
      
      const response = await axios.get(
        `http://localhost:3037/api/frontdesk/checkin?villaId=${villaId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setCheckins(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to load check-ins');
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
      fetchCheckins();
    }
  }, [userInfo.villaId, fetchCheckins]);

  const handleProcessBooking = async (id) => {
    try {
      // Navigate to invoice page with booking ID and checkout flag
      window.location.href = `/invoice/${id}?checkout=true`;
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Error processing checkout. Please try again.');
    }
  };

  return (
    <div className="frontdesk-check-in-container">
      <FrontDeskSidebar />
      <div className="frontdesk-check-in-content">
        <div className="frontdesk-check-in-header">
          <h2>Check-Ins {userInfo.villaLocation && `- ${userInfo.villaLocation}`}</h2>
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
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Action</th>
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
                    <td>{booking._id}</td>
                    <td>{booking.guest_name || "N/A"}</td>
                    <td>{booking.category || booking.category}</td>
                    <td>{new Date(booking.checkInDate).toLocaleDateString()}</td>
                    <td>{new Date(booking.checkOutDate).toLocaleDateString()}</td>
                    <td>${booking.totalAmount?.toFixed(2) || "0.00"}</td>
                    <td>${booking.amountPaid?.toFixed(2) || "0.00"}</td>
                    <td className={booking.balanceDue > 0 ? 'balance-due' : 'balance-paid'}>
                      ${booking.balanceDue?.toFixed(2) || "0.00"}
                    </td>
                    <td>
                      <button 
                        className="checkout-btn"
                        onClick={() => handleProcessBooking(booking._id)}
                       
                      >
                        Check-Out
                      </button>
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

export default FrontdeskCheckin;