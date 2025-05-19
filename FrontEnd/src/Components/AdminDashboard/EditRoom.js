import React, { useState, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AddingRooms.css";

function EditRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState({
    villaLocation: "",
    roomType: "",
    distanceToCity: "",
    pricePerDay: "",
    roomDescription: "",
    amenities: [],
    image: "",
    capacity: 2,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch existing room data
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await axios.get(`http://localhost:3037/api/room/${roomId}`);
        const roomData = response.data;
        
        // Ensure amenities is always an array
        const amenitiesArray = roomData.amenities 
          ? typeof roomData.amenities === 'string' 
            ? JSON.parse(roomData.amenities) 
            : roomData.amenities 
          : [];
        
        setRoom({
          ...roomData,
          amenities: amenitiesArray,
          pricePerDay: roomData.pricePerDay.toString() // Ensure it's a string for the input
        });
      } catch (error) {
        console.error("Error fetching room data:", error);
        alert("Failed to fetch room details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setRoom(prev => ({ ...prev, [name]: value }));
  };

  const handleAmenityChange = (event) => {
    const { checked, value } = event.target;
    setRoom((prev) => ({
      ...prev,
      amenities: checked
        ? [...prev.amenities, value]
        : prev.amenities.filter((amenity) => amenity !== value),
    }));
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!termsAccepted) {
      alert("Please accept the terms and conditions.");
      return;
    }

    if (!room.villaLocation || !room.roomType || !room.distanceToCity  ||!room.pricePerDay || !room.roomDescription|| !room.capacity) {
      alert("Please fill all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("villaLocation", room.villaLocation);
    formData.append("roomType", room.roomType);
    formData.append("distanceToCity", room.distanceToCity);
    formData.append("pricePerDay", room.pricePerDay);
    formData.append("roomDescription", room.roomDescription);
    formData.append("amenities", JSON.stringify(room.amenities));
    formData.append("capacity", room.capacity);

    if (selectedFile) {
      formData.append("image", selectedFile);
    } else if (room.image) {
      formData.append("existingImage", room.image);
    }

    try {
      setLoading(true);
      const response = await axios.put(
        `http://localhost:3037/api/editroom/${roomId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.status === 200) {
        alert("Room updated successfully!");
        navigate("/viewvilla");
      } else {
        alert("Error updating room.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading room details...</p>
      </div>
    );
  }

  return (
    <div className="add-room-container">
      <AdminSidebar />
      <div className="room-wrapper">
        <form className="add-room-form" onSubmit={handleSubmit}>
          <h2 className="title">Edit Room</h2>

          <label className="label">
            Room Location
            <input
              type="text"
              name="villaLocation"
              value={room.villaLocation}
              onChange={handleChange}
              className="input"
              required
            />
          </label>

          <label className="label">
            Room Type
            <select
              name="roomType"
              value={room.roomType}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="" disabled>Select Room Type</option>
              <option value="Family">Family</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Double">Double</option>
            </select>
          </label>

          <label className="label">
            Distance to City
            <select 
              name="distanceToCity" 
              value={room.distanceToCity} 
              onChange={handleChange} 
              className="input"
              required
            >
              <option value="">Select Distance</option>
              <option value="Less than 1 km">Less than 1 km</option>
              <option value="1-5 km">1-5 km</option>
              <option value="5-10 km">5-10 km</option>
              <option value="10-20 km">10-20 km</option>
              <option value="More than 20 km">More than 20 km</option>
            </select>
          </label>

          <label className="label">
            Price per Day ($)
            <input
              type="number"
              name="pricePerDay"
              value={room.pricePerDay}
              onChange={handleChange}
              className="input"
              required
            />
          </label>

          <label className="label">
  Capacity (Number of Guests)
  <input
    type="number"
    name="capacity"
    min="1"
    max="4"
    value={room.capacity}
    onChange={handleChange}
    className="input"
    required
  />
</label>

          <label className="label">
            Room Description
            <textarea
              name="roomDescription"
              value={room.roomDescription}
              onChange={handleChange}
              className="input textarea"
              required
            ></textarea>
          </label>

          <div className="amenities">
            <p className="subtitle">Amenities</p>
            {[
              "Attached Bathroom",
              "Air Conditioning",
              "Television",
              "Balcony",
              "Refrigerator",
              "Washing Machine",
              "Free WiFi",
            ].map((amenity) => (
              <label key={amenity} className="checkbox">
                <input
                  type="checkbox"
                  value={amenity}
                  checked={room.amenities.includes(amenity)}
                  onChange={handleAmenityChange}
                />{" "}
                {amenity}
              </label>
            ))}
          </div>

          <label className="label">
            Room Image
            <input
              type="file"
              accept="image/*"
              className="input"
              onChange={handleFileChange}
            />
          </label>

          {room.image && !selectedFile && (
            <div className="preview-container">
              <h3>Current Image:</h3>
              <img
                src={`http://localhost:3037${room.image}`}
                alt="Room"
                className="preview-image"
              />
            </div>
          )}

          {selectedFile && (
            <div className="preview-container">
              <h3>New Image Preview:</h3>
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="preview-image"
              />
            </div>
          )}

          <div className="terms">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />{" "}
              I have read and agreed to the Terms and Conditions and Privacy Policy
            </label>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Updating..." : "Update"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditRoom;