import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { BsGrid1X2Fill } from "react-icons/bs";
import {
  AiOutlineBarChart,
  AiOutlineUser,
  AiOutlineLogout,
  AiOutlineHome,
} from "react-icons/ai";
import { MdOutlineManageAccounts } from "react-icons/md";
import { FaBed } from "react-icons/fa";

import "./AdminSidebar.css";

const AdminSidebar = () => {
  const [isOpen] = useState(true);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isVillaManagementOpen, setIsVillaManagementOpen] = useState(false);

  const location = useLocation();
  const userId = localStorage.getItem("userId");


  useEffect(() => {
    const path = location.pathname;

    // Auto-open Management section for these routes
    const isManagementPath =
      path.startsWith("/adminbookingmanagement") ||
      path.startsWith("/adminstaffmanagement") ||
      path.startsWith("/addingvilla") ||
      path.startsWith("/addingrooms");

    const isVillaManagementPath =
      path.startsWith("/addingvilla") || path.startsWith("/addingrooms");

    if (isManagementPath) setIsManagementOpen(true);
    if (isVillaManagementPath) setIsVillaManagementOpen(true);
  }, [location.pathname]);

  const toggleManagementDropdown = () => {
    setIsManagementOpen(!isManagementOpen);
  };

  const toggleVillaManagementDropdown = () => {
    setIsVillaManagementOpen(!isVillaManagementOpen);
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <h2 className="sidebar-logo">Villa Thus</h2>
      <ul className="nav">
        <li>
          <Link to={`/admindashboard/${userId}`}>
            <BsGrid1X2Fill className="icon" /> {isOpen && <span>Dashboard</span>}
          </Link>
        </li>

        {/* Management Dropdown */}
        <li className="management">
          <div className="dropdown-toggle" onClick={toggleManagementDropdown}>
            <MdOutlineManageAccounts className="icon" />
            {isOpen && <span>Management</span>}
          </div>

          {isOpen && isManagementOpen && (
            <ul className="dropdown-menu">
              <li>
                <Link to="/adminbookingmanagement">Booking Management</Link>
              </li>

              <li>
                <div className="dropdown-toggle" onClick={toggleVillaManagementDropdown}>
                  Villa Management
                </div>

                {isVillaManagementOpen && (
                  <ul className="dropdown-submenu">
                    <li>
                      <Link to="/addingvilla">
                        <AiOutlineHome className="icon" />
                        {isOpen && <span>Add Villa</span>}
                      </Link>
                    </li>
                    <li>
                      <Link to="/addingrooms">
                        <FaBed className="icon" />
                        {isOpen && <span>Add Room</span>}
                      </Link>
                    </li>
                  </ul>
                )}
              </li>

              <li>
                <Link to="/adminstaffmanagement">Staff Management</Link>
              </li>
            </ul>
          )}
        </li>

        <li>
          <Link to="/viewvilla">
            <AiOutlineHome className="icon" /> {isOpen && <span>View Villa</span>}
          </Link>
        </li>

        <li>
          <Link to="/reports/revenue">
            <AiOutlineBarChart className="icon" /> {isOpen && <span>Report</span>}
          </Link>
        </li>

        

          <li>
                <Link to={`/adminprofile/${userId}`}>  {/* Changed from /frontdeskprofile */}
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

export default AdminSidebar;
