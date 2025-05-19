import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./HomePage.css";
import Footer from "./Footer";
import PropertyPage from "./PropertyPage";

const Homepage = () => {
  const navigate = useNavigate();
  const [isGuestDropdownOpen, setIsGuestDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [showFooter, setShowFooter] = useState(false);
  const [showPropertyPage, setShowPropertyPage] = useState(false);
  
  // Filter States
  const [selectedVilla, setSelectedVilla] = useState("");
  const [category, setCategory] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [searchError, setSearchError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Villa locations for dropdown
  const [villaLocations, setVillaLocations] = useState([]);
  const [locationsError] = useState("");

  // Set minimum check-in date to today
  const today = new Date().toISOString().split('T')[0];
  
  // Set minimum check-out date based on check-in date
  const minCheckOutDate = checkIn 
    ? new Date(new Date(checkIn).getTime() + 86400000).toISOString().split('T')[0] 
    : today;
    

  // Fetch villa locations on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get("http://localhost:3037/api/homepage/locations");
        setVillaLocations(response.data);
      } catch (err) {
        console.error("Failed to fetch locations", err);
      }
    };
  
    fetchLocations();
  }, []);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      // Show footer when scrolled 100px from bottom
      const scrollPosition = window.innerHeight + window.scrollY;
      const pageHeight = document.documentElement.scrollHeight;
      
      if (pageHeight - scrollPosition < 100 || window.scrollY > 300) {
        setShowFooter(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Scroll detection for property page
  useEffect(() => {
    const handleScroll = () => {
      // Show propertypage when scrolled 100px from bottom
      const scrollPosition = window.innerHeight + window.scrollY;
      const pageHeight = document.documentElement.scrollHeight;
      
      if (pageHeight - scrollPosition < 100 || window.scrollY > 300) {
        setShowPropertyPage(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsGuestDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateSearch = () => {
    if (!category) {
      setSearchError("Please select a booking type");
      return false;
    }
    
    if (!checkIn || !checkOut) {
      setSearchError("Please select both check-in and check-out dates");
      return false;
    }
    
    // Ensure check-out date is after check-in date
    if (new Date(checkOut) <= new Date(checkIn)) {
      setSearchError("Check-out date must be after check-in date");
      return false;
    }
    
    // Check guest count limit based on booking type
    const totalGuests = parseInt(adults) + parseInt(children);
    if (category === 'villa' && totalGuests > 15) {
      setSearchError("Maximum 15 guests allowed for villa booking");
      return false;
    }
    
    if (category === 'room' && totalGuests > 4) {
      setSearchError("Maximum 4 guests allowed per room");
      return false;
    }
    
    // Clear any previous errors
    setSearchError("");
    return true;
  };

  const handleSearch = async () => {
    if (!validateSearch()) return;
    
    setIsLoading(true);
    setSearchError("");
    
    try {
      const searchCriteria = {
        selectedVilla, 
        category, 
        checkIn, 
        checkOut, 
        adults: parseInt(adults), 
        children: parseInt(children)
      };
      
      const response = await axios.post("http://localhost:3037/api/homepage", searchCriteria, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      
      navigate("/booknow", { 
        state: {
          results: response.data,
          searchCriteria: searchCriteria  // Pass complete search criteria
        } 
      });
      
    } catch (err) {
      console.error("Full error details:", err.response?.data || err.message);
      setSearchError(
        err.response?.data?.message || 
        err.message || 
        "Failed to connect to server. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container">
      {/* Navbar */}
      <nav className="navbar">
        <h1 className="homepage-logo">Villa Thus</h1>
        <ul className="nav-links">
          <li><Link to="/homepage">Home</Link></li>
          <li>
            <Link 
              to="#" 
              onClick={(e) => {
                e.preventDefault();
                setShowPropertyPage(true);
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }}
            >
              Property
            </Link>
          </li>
          <li><Link to="/reviewsdashboard">Reviews</Link></li>
          <li>
            <Link 
              to="#" 
              onClick={(e) => {
                e.preventDefault();
                setShowFooter(true);
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }}
            >
              About Us
            </Link>
          </li>
        </ul>
      </nav>
      <div className="homepage-container">
      {/* Hero Section */}
      <div className="hero">
        <h2 className="hero-title">Discover Your Perfect Getaway</h2>
        <p className="hero-subtitle">Find the best villas for your stay</p>
      </div>

      {/* Search Filters */}
      <div className="search-filters">
        <select 
          value={selectedVilla} 
          onChange={(e) => setSelectedVilla(e.target.value)}
          aria-label="Select location"
        >
          <option value="">Select Location</option>
          {villaLocations.map((location, index) => (
            <option key={index} value={location}>{location}</option>
          ))}
        </select>

        <select 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Select booking type"
          required
        >
          <option value="">Booking Type</option>
          <option value="room">Room Booking</option>
          <option value="villa">Villa Booking</option>
        </select>

        {/* Guest Dropdown */}
        <div className="guest-dropdown" ref={dropdownRef}>
          <button 
            className="guest-dropdown-btn" 
            onClick={() => setIsGuestDropdownOpen(!isGuestDropdownOpen)}
            aria-label="Select guests"
          >
            {adults} Adults · {children} Children 
          </button>
          {isGuestDropdownOpen && (
            <div className="guest-menu">
              {/* Adults Selection */}
              <div className="guest-item">
                <div>
                  <p className="guest-title">Adults</p>
                  <p className="guest-subtitle">Age 12+</p>
                </div>
                <div className="guest-counter">
                  <button 
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    aria-label="Decrease adults"
                  >-</button>
                  <span>{adults}</span>
                  <button 
                    onClick={() => setAdults(adults + 1)}
                    aria-label="Increase adults"
                  >+</button>
                </div>
              </div>

              {/* Children Selection */}
              <div className="guest-item">
                <div>
                  <p className="guest-title">Children</p>
                  <p className="guest-subtitle">Age 2-12</p>
                </div>
                <div className="guest-counter">
                  <button 
                    onClick={() => setChildren(Math.max(0, children - 1))}
                    aria-label="Decrease children"
                  >-</button>
                  <span>{children}</span>
                  <button 
                    onClick={() => setChildren(children + 1)}
                    aria-label="Increase children"
                  >+</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <input 
          type="date" 
          value={checkIn} 
          onChange={(e) => setCheckIn(e.target.value)} 
          min={today}
          placeholder="Check-in"
          aria-label="Check-in date"
          required
        />
        
        <input 
          type="date" 
          value={checkOut} 
          onChange={(e) => setCheckOut(e.target.value)} 
          min={minCheckOutDate}
          placeholder="Check-out"
          aria-label="Check-out date"
          required
          disabled={!checkIn}
        />

        <button 
          className={`search-btn ${isLoading ? 'loading' : ''}`}
          onClick={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Error Messages */}
      {locationsError && (
        <div className="search-error">{locationsError}</div>
      )}
      
      {searchError && (
        <div className="search-error">{searchError}</div>
      )}

      {/* Register/Login Buttons */}
      <div className="auth-buttons">
        <Link to="/register">
          <button className="register-button">Register</button>
        </Link>
        <Link to="/login">
          <button className="login-button">Login</button>
        </Link>
      </div>
      <div className={`propertypage ${showPropertyPage ? 'visible' : 'hidden'}`}>
        <PropertyPage/>
      </div>
      <div className={`footer-container ${showFooter ? 'visible' : 'hidden'}`}>
        <Footer />
      </div>
    </div>
    </div>
  );
};

export default Homepage;
