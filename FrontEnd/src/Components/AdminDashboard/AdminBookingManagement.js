import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminBookingManagement.css";
import {  AiOutlineSearch } from "react-icons/ai";
import AdminSidebar from "./AdminSidebar";

const AdminBookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [villaFilter, setVillaFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const fetchBookings = async () => {
    try {
      const response = await axios.get("http://localhost:3037/api/adminbookingmanagement");
      setBookings(response.data);
    } catch (error) {
      console.error("Error fetching booking data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Get unique villa locations for filter dropdown
  const uniqueVillas = [...new Set(bookings.map(booking => booking.villa_location))].filter(Boolean);

  // Filter bookings based on search and filters
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.villa_location && booking.villa_location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesVilla = villaFilter === "all" || booking.villa_location === villaFilter;
    const matchesCategory = categoryFilter === "all" || booking.category.toLowerCase() === categoryFilter.toLowerCase();
  
    return matchesSearch && matchesStatus && matchesVilla && matchesCategory;
  });

  const formatStatusClass = (status) =>
    status.toLowerCase().trim().replace(/[\s-]/g, "");
  return (
    <div className="Booking-container">
      <AdminSidebar />
      <div className="Booking-wrapper">
        <div className="Booking-header">
          <h2>Booking Management</h2>
          <div className="user-info">
            <span className="user-name">Admin User</span>
           
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="booking-filters">
          <div className="search-box">
            <AiOutlineSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by customer name or villa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-selectors">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="check-in">Check-In</option>
              <option value="check-out">Check-Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              value={villaFilter}
              onChange={(e) => setVillaFilter(e.target.value)}
              disabled={uniqueVillas.length === 0}
            >
              <option value="all">All Villas</option>
              {uniqueVillas.map(villa => (
                <option key={villa} value={villa}>{villa}</option>
              ))}
            </select>
            <select
    value={categoryFilter}
    onChange={(e) => setCategoryFilter(e.target.value)}
  >
    <option value="all">All Categories</option>
    <option value="villa">Villa</option>
    <option value="room">Room</option>
  </select>
          </div>
        </div>

        {/* Booking Table - Now using filteredBookings */}
        <table className="booking-table">
          <thead>
            <tr>
            <th>ID</th>
              <th>Guest Name</th>
              <th>Villa</th>
              <th>Check-In Date</th>
              <th>Check-Out Date</th>
              <th>Category</th>
              
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
  {loading ? (
    <tr>
      <td colSpan="7">Loading...</td>
    </tr>
  ) : filteredBookings.length > 0 ? (
    filteredBookings.map((booking) => {
      console.log("Booking status:", booking.status); // ADD THIS LINE

      return (
        <tr key={booking.id}>
          <td>{booking.id}</td>
          <td>{booking.customer_name}</td>
          <td>{booking.villa_location || "N/A"}</td>
          <td>{booking.check_in_date}</td>
          <td>{booking.check_out_date}</td>
          <td>{booking.category}</td>
          
          <td>
            <span className={`status-badge ${formatStatusClass(booking.status)}`}>
              {booking.status}
            </span>
          </td>
        </tr>
      );
    })
  ) : (
    <tr>
      <td colSpan="7">No bookings match your filters.</td>
    </tr>
  )}
</tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBookingManagement;