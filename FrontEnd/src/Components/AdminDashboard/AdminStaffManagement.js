import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminStaffManagement.css";
import {  AiOutlineSearch } from "react-icons/ai";
import AdminSidebar from "./AdminSidebar";
import { useNavigate } from "react-router-dom";

const AdminStaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [villaFilter, setVillaFilter] = useState("all");
  const navigate = useNavigate();

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get("http://localhost:3037/api/staff");
      setStaff(response.data);
    } catch (error) {
      console.error("Error fetching staff data:", error);
      setError("Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Get unique villa locations and roles for filter dropdowns
  const uniqueVillas = [...new Set(staff.map(member => member.villaLocation))].filter(Boolean);
  const uniqueRoles = [...new Set(staff.map(member => member.role))].filter(Boolean);

  // Filter staff based on search and filters
  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.villaLocation && member.villaLocation.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesVilla = villaFilter === "all" || member.villaLocation === villaFilter;
    
    return matchesSearch && matchesRole && matchesVilla;
  });

  const deleteStaff = async (userId, role) => {
    if (!window.confirm(`Are you sure you want to delete this ${role}? This action cannot be undone.`)) {
      return;
    }
  
    try {
      setError("");
      const response = await axios.delete(`http://localhost:3037/api/staff/${userId}`, {
        data: { role },
        headers: { 'Content-Type': 'application/json' }
      });
  
      if (response.data.success) {
        setStaff(prevStaff => prevStaff.filter(member => member.id !== userId));
        setTimeout(fetchStaff, 500);
      }
    } catch (error) {
      console.error("Delete staff error:", error);
      setError(error.response?.data?.message || "Failed to delete staff member");
    }
  };

  const formatRole = (role) => {
    return role === "front_desk" ? "Front Desk" : 
           role === "manager" ? "Manager" : 
           role;
  };

  return (
    <div className="Staff-container">
      <AdminSidebar />
      
      <div className="Staff-wrapper">
        <div className="Staff-header">
          <h2>Staff Management</h2>
          <div className="user-info">
            <span className="user-name">Admin User</span>
          
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="staff-filters">
          <div className="search-box">
            <AiOutlineSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, email or villa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-selectors">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{formatRole(role)}</option>
              ))}
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
          </div>

          <button 
            className="add-staff-btn" 
            onClick={() => navigate("/addmanagers")}
          >
            + Add Staff
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <table className="staff-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Role</th>
              <th>Assigned Villa</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6">Loading...</td>
              </tr>
            ) : filteredStaff.length > 0 ? (
              filteredStaff.map((member) => (
                <tr key={member.user_id || member.id}>
                  <td>{member.id}</td>
                  <td>{member.full_name}</td>
                  <td>{member.contact_number}</td>
                  <td>{member.email}</td>
                  <td>{formatRole(member.role)}</td>
                  <td>{member.villaLocation || "Not assigned"}</td>
                  <td className="action-buttons">
                    <button 
                      className="edit-btn" 
                      onClick={() => navigate(`/editmanager/${member.id}`)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-btn" 
                      onClick={() => deleteStaff(member.id, member.role)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No staff members match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminStaffManagement;