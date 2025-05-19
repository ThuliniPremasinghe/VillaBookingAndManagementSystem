import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RoomBookingForm.css";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const RoomBookingForm = () => {
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
    mealPlan: "",
    transportation: "",
    specialRequest: "",
    agreeTerms: false,
    totalCost: 0,
    villaId: id,
    propertyType: 'room',
    adults: location.state?.searchCriteria?.adults || 1,
  children: location.state?.searchCriteria?.children || 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setBookedDates] = useState([]);
  const [fetchingDates, setFetchingDates] = useState(true);
  const [pricePerDay, setPricePerDay] = useState(0);

 // Fetch room data and booked dates
useEffect(() => {
  const fetchRoomData = async () => {
    try {
      const [roomResponse, datesResponse] = await Promise.all([
        axios.get(`http://localhost:3037/api/room/${id}`),
        axios.get(`http://localhost:3037/api/roombookingform/${id}/dates`)
      ]);
      
      setPricePerDay(roomResponse.data.pricePerDay || 0);
      setBookedDates(datesResponse.data.bookedDates || []);
    } catch (err) {
      console.error("Error fetching room data:", err);
      setError("Failed to load room data. Please refresh the page.");
    } finally {
      setFetchingDates(false);
    }
  };

  fetchRoomData();
}, [id]);

// Calculate total cost when dates change
useEffect(() => {
  const calculateTotal = () => {
    if (!formData.checkInDate || !formData.checkOutDate) {
      setFormData(prev => ({ ...prev, totalCost: 0 }));
      return;
    }

    const startDate = new Date(formData.checkInDate);
    const endDate = new Date(formData.checkOutDate);
    
    // Calculate number of nights
    const timeDiff = endDate.getTime() - startDate.getTime();
    const numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (numberOfNights <= 0) {
      setFormData(prev => ({ ...prev, totalCost: 0 }));
      return;
    }

    let total = pricePerDay * numberOfNights;

    
    const deposit = total * 0.3;
    setFormData(prev => ({ ...prev, totalCost: total, depositAmount: deposit }));
  };

  calculateTotal();
}, [formData.checkInDate, formData.checkOutDate, pricePerDay]);

  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3037/api/roombookingform/${id}/dates`
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
  
    try {
      // Prepare the complete booking data
      const bookingData = {
        ...formData,
        villaId: id,
        propertyType: 'room',
        depositAmount: formData.depositAmount || formData.totalCost * 0.3
      };
  
      console.log('Submitting booking data:', bookingData);
  
      const response = await axios.post(
        "http://localhost:3037/api/roombookingform",
        bookingData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
  
      // In both booking forms, update the navigation after successful booking:
if (response.data?.success) {
  navigate('/checkoutpage', {
    state: {
      bookingId: response.data.bookingId,
      amount: formData.depositAmount,
      totalAmount: formData.totalCost,
      customerEmail: formData.email ,// Add this line to pass the email
      status:'pending'
    }
  });

} else {
        throw new Error(response.data?.message || 'Booking failed without error message');
      }
    } catch (err) {
      let errorMsg = 'Booking failed. Please try again.';
      
      if (err.response) {
        // Server responded with error
        errorMsg = err.response.data?.sqlError || 
                  err.response.data?.message ||
                  `Server error (${err.response.status})`;
        
        console.error('Full error response:', err.response.data);
      } else if (err.request) {
        // Request was made but no response
        errorMsg = 'No response from server';
      } else {
        // Setup error
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      console.error('Booking error details:', {
        error: err,
        response: err.response?.data
      });
    } finally {
      setLoading(false);
    }
  };
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="form-container">
      <div className="form-wrapper">
        <h2>Room Booking</h2>
        {error && <div className="error-message">{error}</div>}
        
        {fetchingDates ? (
          <div className="loading-message">Loading availability data...</div>
        ) : (
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
                disabled={loading || fetchingDates}
              >
                {loading ? 'Processing...' : 'BOOK NOW'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RoomBookingForm;