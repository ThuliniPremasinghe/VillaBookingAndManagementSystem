//import React, { useState, useEffect } from "react";
//import axios from "axios";
import "./AdminVillaManagement.css";
import { AiOutlineUser } from "react-icons/ai";
import AdminSidebar from "./AdminSidebar";


const AdminVillaManagement = () => {
  //const [villa, setVilla] = useState([]); // Staff state
  
  

  // Function to fetch staff data from the backend
//   const fetchVilla = async () => {
//     try {
//       const response = await axios.get("http://localhost:3037/api/adminvillamanagement");
//       setVilla(response.data);
//     } catch (error) {
//       console.error("Error fetching villa data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

  // Load staff data when the component mounts
//   useEffect(() => {
//     fetchVilla();
//   }, []);

  return (
    <div className="Villa-container">
      <AdminSidebar /> {/* Sidebar Navigation */}
      <div className="Villa-wrapper">
        <div className="Villa-header">
          <h2>Villa Management</h2>
          <div className="user-info">
            <span className="user-name">Amitha Premasinghe</span>
            <AiOutlineUser className="user-icon" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminVillaManagement;
