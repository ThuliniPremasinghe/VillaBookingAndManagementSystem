import React from "react";
import "./BookingHistory.css";
import {  AiOutlineUser } from "react-icons/ai";


const BookingHistory = () => {
  // Sample booking data (can be fetched from an API)
  const bookings = [  // <-- Make sure this is inside the function
    
  ];

  return (
    <div className="dashboard-content">
    
      
        <header>
          <h2>Booking History</h2>
          <span className="user">Thulini Premasinghe <AiOutlineUser className="user-icon" /></span>
          
        </header>
      <table className="bookinghistory-table">
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Category</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Guest</th>
            <th>Villa</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking, index) => (
            <tr key={index}>
              <td>{booking.id}</td>
              <td>{booking.category}</td>
              <td>{booking.checkIn}</td>
              <td>{booking.checkOut}</td>
              <td>{booking.guest}</td>
              <td>{booking.villa}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BookingHistory;
