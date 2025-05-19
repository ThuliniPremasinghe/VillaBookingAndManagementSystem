import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ManagerCheckout.css";

import ManagerSidebar from "./ManagerSidebar";

const ManagerCheckout = () => {
  const [checkouts, setCheckouts] = useState([]);
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

  const fetchCheckouts = async () => {
   try {
         setLoading(true);
         const token = localStorage.getItem("token");
         const villaId = userInfo.villaId; // Use villaId instead of villaLocation
         
         if (!villaId) {
           throw new Error('Assigned Villa ID is not available');
         }
         
         const response = await axios.get(`http://localhost:3037/api/frontdesk/checkout`, {
           headers: { Authorization: `Bearer ${token}` },
           params: { villaId } // Send villaId instead of villaLocation
         });
      
      if (response.data.success) {
        setCheckouts(response.data.data);
        setError(null);
      } else {
        throw new Error(response.data.error || 'Failed to load checkouts');
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
      fetchCheckouts();
      
      const interval = setInterval(fetchCheckouts, 30000);
      return () => clearInterval(interval);
    }
  }, [userInfo.userId, userInfo.villaLocation]);

  return (
    <div className="Manager-check-out-container">
      <ManagerSidebar />
      <div className="Manager-check-out-content">
        <div className="Manager-check-out-header">
          <h2>Check Out {userInfo.villaLocation && `- ${userInfo.villaLocation}`}</h2>
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
              <th>Customer Name</th>
              <th>Contact Number</th>
                <th>Category</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Status</th>
                
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="loading-text">Loading check-out...</td>
                </tr>
              ) : checkouts.length > 0 ? (
                checkouts.map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking._id || "N/A"}</td>
                    <td>{booking.guest_name || "N/A"}</td>
                    <td>{booking.contact_number || "N/A"}</td>
                    <td>{booking.propertyType || "N/A"}</td>
                    <td>{new Date(booking.checkInDate).toLocaleDateString()}</td>
                    <td>{new Date(booking.checkOutDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${booking.status.toLowerCase()}`}>
                        {booking.status}
                      </span>
                    </td>
                    
                    <td>
                      <span className="payment-status paid">
                        Paid
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">No check-out found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerCheckout;