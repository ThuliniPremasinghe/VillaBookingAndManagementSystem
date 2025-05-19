import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./FrontdeskCheckout.css";

import FrontDeskSidebar from "./FrontDeskSidebar";
import { jwtDecode } from 'jwt-decode';

const FrontdeskCheckout = () => {
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState({
    userId: null,
    villaId: null,
    fullName: "User",
    villaLocation: ""
  });

  const fetchCheckouts = useCallback(async (villaId) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        `http://localhost:3037/api/frontdesk/checkout?villaId=${villaId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setCheckouts(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to load checkouts');
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    let villaId = user.villaId || localStorage.getItem("villaId");
    let villaLocation = user.villaLocation || localStorage.getItem("villaLocation");
    
    if (!villaId && token) {
      try {
        const decoded = jwtDecode(token);
        villaId = decoded.villaId;
        villaLocation = decoded.villaLocation;
        if (villaId) {
          localStorage.setItem("villaId", villaId);
        }
        if (villaLocation) {
          localStorage.setItem("villaLocation", villaLocation);
        }
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    }

    setUserInfo({
      userId: user.id,
      villaId: villaId,
      fullName: user.fullName || "User",
      villaLocation: villaLocation || ""
    });

    if (villaId) {
      fetchCheckouts(villaId);
    } else {
      setError("Villa assignment is missing. Please contact admin.");
      setLoading(false);
    }
  }, [fetchCheckouts]);

  return (
    <div className="frontdesk-check-out-container">
      <FrontDeskSidebar />
      <div className="frontdesk-check-out-content">
        <div className="frontdesk-check-out-header">
          <h2>Check Out {userInfo.villaId && `- ${userInfo.villaLocation || `Villa ID: ${userInfo.villaId}`}`}</h2>
          <div className="user-info">
            <span className="user-name">{userInfo.fullName}</span>
          
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="table-responsive">
          <table className="check-out-table">
            <thead>
              <tr>
              <th>ID</th>
                <th>Guest Name</th>
                <th>Contact Number</th>
                <th>Category</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="loading-text">Loading check-outs...</td>
                </tr>
              ) : checkouts.length > 0 ? (
                checkouts.map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking._id}</td>
                    <td>{booking.guest_name || "N/A"}</td>
                    <td>{booking.contact_number || "N/A"}</td>
                    <td>{booking.propertyType === 'villa' ? 'Villa' : 'Room'}</td>
                    <td>{new Date(booking.checkInDate).toLocaleDateString()}</td>
                    <td>{new Date(booking.checkOutDate).toLocaleDateString()}</td>
                    
                    
                    <td>
                      <span className="payment-status paid">
                        Paid
                      </span>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">No check-outs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FrontdeskCheckout;