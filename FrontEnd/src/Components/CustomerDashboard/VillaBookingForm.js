import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RoomBookingForm.css";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const VillaBookingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    nic: "",
    checkInDate: location.state?.checkInDate || "",
    checkOutDate: location.state?.checkOutDate || "",
    specialRequest: "",
    agreeTerms: false,
    totalCost: 0,
    villaId: id,
    propertyType: 'villa'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookedDates, setBookedDates] = useState([]);
  const [fetchingDates, setFetchingDates] = useState(true);
  const [villaDetails, setVillaDetails] = useState(null);
  const [villaLoading, setVillaLoading] = useState(true);

  useEffect(() => {
    const fetchVillaDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:3037/api/villa/${id}`);
        setVillaDetails(response.data);
      } catch (err) {
        console.error("Error fetching villa details:", err);
        setError("Failed to load villa details. Please refresh the page.");
      } finally {
        setVillaLoading(false);
      }
    };

    fetchVillaDetails();
  }, [id]);

  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3037/api/villabookingform/${id}/dates`
        );
        setBookedDates(response.data.bookedDates || []);
      } catch (err) {
        console.error("Error fetching booked dates:", err);
        setError("Failed to load availability data. Please refresh the page.");
      } finally {
        setFetchingDates(false);
      }
    };

    fetchBookedDates();
  }, [id]);

  useEffect(() => {
    const calculateTotal = () => {
      if (!villaDetails || !formData.checkInDate || !formData.checkOutDate) {
        return;
      }

      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);
      
      // Calculate number of nights
      const timeDiff = checkOut - checkIn;
      const nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      let total = villaDetails.pricePerDay * nights;

      

      const deposit = total * 0.3;
      setFormData(prev => ({ ...prev, totalCost: total, depositAmount: deposit }));
    };

    calculateTotal();
  }, [formData.checkInDate, formData.checkOutDate, villaDetails]);

  const isDateRangeAvailable = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return !bookedDates.some(booking => {
      const bookedStart = new Date(booking.check_in_date);
      const bookedEnd = new Date(booking.check_out_date);
      return (start >= bookedStart && start <= bookedEnd) || 
             (end >= bookedStart && end <= bookedEnd) ||
             (start <= bookedStart && end >= bookedEnd);
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validations
    if (!formData.agreeTerms) {
      setError("You must agree to the Terms and Conditions.");
      setLoading(false);
      return;
    }

    if (!formData.checkInDate || !formData.checkOutDate) {
      setError("Please select both check-in and check-out dates");
      setLoading(false);
      return;
    }

    if (new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
      setError("Check-out date must be after check-in date");
      setLoading(false);
      return;
    }

    // Date availability check
    if (!isDateRangeAvailable(formData.checkInDate, formData.checkOutDate)) {
      setError("The selected dates are not available. Please choose different dates.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3037/api/villabookingform", 
        formData
      );

      if (response.data?.success) {
        navigate('/checkoutpage', {
          state: {
            bookingId: response.data.bookingId,
            amount: formData.depositAmount,
            totalAmount: formData.totalCost,
            customerEmail: formData.email,
            status: 'pending'
          }
        });
      } else {
        setError(response.data.message || "Booking failed");
      }
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.response?.data?.message || "Error submitting booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (villaLoading || fetchingDates) {
    return (
      <div className="form-container">
        <div className="form-wrapper">
          <h2>Villa Booking</h2>
          <div className="loading-message">Loading villa details and availability...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-wrapper">
        <h2>Villa Booking</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input 
              type="text" 
              name="fullName" 
              value={formData.fullName} 
              placeholder="Enter Full Name" 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              placeholder="Enter Email Address" 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Contact Number *</label>
            <input 
              type="tel" 
              name="contactNumber" 
              value={formData.contactNumber} 
              placeholder="Enter Contact Number" 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>NIC *</label>
            <input 
              type="text" 
              name="nic" 
              value={formData.nic} 
              placeholder="Enter NIC" 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Check-In Date *</label>
            <input
              type="date"
              name="checkInDate"
              value={formData.checkInDate}
              onChange={handleChange}
              min={today}
              required
              readOnly={!!location.state?.checkInDate}
            />
          </div>

          <div className="form-group">
            <label>Check-Out Date *</label>
            <input
              type="date"
              name="checkOutDate"
              value={formData.checkOutDate}
              onChange={handleChange}
              min={formData.checkInDate || today}
              required
              readOnly={!!location.state?.checkOutDate}
            />
          </div>

          <div className="form-group">
              <label>Meal Plan (Optional)</label>
              <select 
                name="mealPlan" 
                value={formData.mealPlan} 
                onChange={handleChange}
              >
                <option value="">Select Meal Plan</option>
                <option value="Self Service">Self Service </option>
                <option value="Half Board">Half Board</option>
                <option value="Full Board">Full Board </option>
              </select>
            </div>

            <div className="form-group">
              <label>Transportation (Optional)</label>
              <select 
                name="transportation" 
                value={formData.transportation} 
                onChange={handleChange}
              >
                <option value="">Select Transportation</option>
                <option value="Van - 10 seats">Van - 10 seats</option>
                <option value="Car - 4 seats">Car - 4 seats </option>
              </select>
            </div>

          <div className="form-group">
            <label>Special Requests (Optional)</label>
            <textarea 
              name="specialRequest" 
              value={formData.specialRequest} 
              placeholder="Any special requests?" 
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Total Cost (Without Taxes and Additional Charges)</label>

            <input 
              type="text" 
              value={`$ ${formData.totalCost.toLocaleString()}`} 
              readOnly 
              className="total-cost"
            />
          </div>

          <div className="checkbox-group">
            <input 
              type="checkbox" 
              name="agreeTerms" 
              checked={formData.agreeTerms} 
              onChange={handleChange} 
              required 
            />
            <label>I have read and agreed to the Terms and Conditions and Privacy Policy *</label>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'BOOK NOW'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VillaBookingForm;