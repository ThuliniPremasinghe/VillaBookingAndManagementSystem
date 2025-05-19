import React, { useState ,useEffect} from "react";
import { Link } from "react-router-dom";
import { BsGrid1X2Fill,  } from "react-icons/bs";
import { AiOutlineBarChart, AiOutlineUser, AiOutlineLogout } from "react-icons/ai";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {  faClock, faSignInAlt, faSignOutAlt,faTimesCircle  } from "@fortawesome/free-solid-svg-icons";
import { AiOutlineHome } from "react-icons/ai";
import "./ManagerSidebar.css";
import { useLocation } from "react-router-dom";

const ManagerSidebar = () => {
  const [isOpen] = useState(true);
  const [bookingsOpen, setBookingsOpen] = useState(false);

  const location = useLocation();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const path = location.pathname;
    const isBookingRoute =
      path.startsWith("/managerpending") ||
      path.startsWith("/managercheckin") ||
      path.startsWith("/managercheckout") ||
      path.startsWith("/managercancellation");
  
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
          <Link to={`/managerdashboard/${userId}`}>
            <BsGrid1X2Fill className="icon" /> {isOpen && <span>Dashboard</span>}
          </Link>
        </li>
        
        <li className={`dropdown-parent ${bookingsOpen ? 'active' : ''}`}>
          <div className="dropdown-trigger" onClick={toggleBookings}>
            <AiOutlineHome className="icon" />
            {isOpen && (
              <>
                <span>Bookings</span>
                
              </>
            )}
          </div>
          {bookingsOpen && isOpen && (
            <ul className="dropdown-content">
              <li>
                <Link to="/managerpending">
                  <FontAwesomeIcon icon={faClock} className="sub-icon" />
                  <span>Pending</span>
                </Link>
              </li>
              <li>
                <Link to="/managercheckin">
                  <FontAwesomeIcon icon={faSignInAlt} className="sub-icon" />
                  <span>Check-in</span>
                </Link>
              </li>
              <li>
                <Link to="/managercheckout">
                  <FontAwesomeIcon icon={faSignOutAlt} className="sub-icon" />
                  <span>Check-out</span>
                </Link>
              </li>
              <li>
                <Link to="/managercancellation">
                  <FontAwesomeIcon icon={faTimesCircle} className="sub-icon" />
                  <span>Cancellations</span>
                </Link>
              </li>
            </ul>
          )}
        </li>

        <li>
          <Link to="/ChargesManagement">
            <AiOutlineBarChart className="icon" /> {isOpen && <span>Additional Charges</span>}
          </Link>
        </li>

        

          <li>
                <Link to={`/managerprofile/${userId}`}>  {/* Changed from /frontdeskprofile */}
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

export default ManagerSidebar;