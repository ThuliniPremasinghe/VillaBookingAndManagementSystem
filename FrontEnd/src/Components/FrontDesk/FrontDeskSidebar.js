import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { BsGrid1X2Fill } from "react-icons/bs";
import {
  AiOutlineBarChart,
  AiOutlineUser,
  AiOutlineLogout,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineStop,
  AiOutlineHome,
} from "react-icons/ai";

import "./FrontDeskSidebar.css";

const FrontDeskSidebar = () => {
  const [isOpen] = useState(true);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const location = useLocation();

  const userId = localStorage.getItem("userId");


  useEffect(() => {
    const path = location.pathname;
    const isBookingRoute =
      path.startsWith("/frontdeskpending") ||
      path.startsWith("/frontdeskcheckin") ||
      path.startsWith("/frontdeskcheckout") ||
      path.startsWith("/frontdeskcancellation");

    if (isBookingRoute) {
      setBookingsOpen(true);
    }
  }, [location.pathname]);

  const toggleBookings = () => {
    setBookingsOpen(!bookingsOpen);
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <h2 className="sidebar-logo">Villa Thus</h2>
      <ul className="nav">
        <li>
        <Link to={`/frontdeskdashboard/${userId}`}>
            <BsGrid1X2Fill className="icon" /> {isOpen && <span>Dashboard</span>}
          </Link>
        </li>

        <li className={`dropdown-parent ${bookingsOpen ? "active" : ""}`}>
          <div className="dropdown-trigger" onClick={toggleBookings}>
            <AiOutlineHome className="icon" />
            {isOpen && <span>Bookings</span>}
          </div>
          {bookingsOpen && isOpen && (
            <ul className="dropdown-content">
              <li>
                <Link to="/frontdeskpending">
                  <AiOutlineBarChart className="sub-icon" />
                  <span>Pending</span>
                </Link>
              </li>
              <li>
                <Link to="/frontdeskcheckin">
                  <AiOutlineCheckCircle className="sub-icon" />
                  <span>Check-in</span>
                </Link>
              </li>
              <li>
                <Link to="/frontdeskcheckout">
                  <AiOutlineCloseCircle className="sub-icon" />
                  <span>Check-out</span>
                </Link>
              </li>
              <li>
                <Link to="/frontdeskcancellation">
                  <AiOutlineStop className="sub-icon" />
                  <span>Cancellations</span>
                </Link>
              </li>
            </ul>
          )}
        </li>

        <li>
        <Link to={`/profile/${userId}`}>  {/* Changed from /frontdeskprofile */}
  <AiOutlineUser className="icon" />
  {isOpen && <span>Profile</span>}
</Link>
        </li>

        <li className="logout">
          <Link to="/HomePage">
            <AiOutlineLogout className="icon" /> {isOpen && <span>Log Out</span>}
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default FrontDeskSidebar;
