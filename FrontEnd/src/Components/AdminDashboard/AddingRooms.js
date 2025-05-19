import React, { useState,useEffect  } from "react";
import AdminSidebar from "./AdminSidebar"; // Import Sidebar
import "./AddingRooms.css";
import axios from "axios";

function AddingRooms() {
  const [selectedFile, setSelectedFile] = useState(null); // Allow only one image
  const [villaLocation, setVillaLocation] = useState("");
  const [villaLocations, setVillaLocations] = useState([]);
  const [roomType, setRoomType] = useState("");
  const [distanceToCity, setDistanceToCity] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [amenities, setAmenities] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [capacity, setCapacity] = useState(2);
  const [loadingLocations, setLoadingLocations] = useState(true); // Loading state

  const handleFileChange = (event) => {
    const file = event.target.files[0]; // Single file upload
    setSelectedFile(file);
  };

  const handleAmenityChange = (event) => {
    const { checked, value } = event.target;
    if (checked) {
      setAmenities([...amenities, value]);
    } else {
      setAmenities(amenities.filter((amenity) => amenity !== value));
    }
  };

  useEffect(() => {
    const fetchVillaLocations = async () => {
      try {
        const response = await axios.get("http://localhost:3037/api/locations");
        setVillaLocations(response.data);
        setLoadingLocations(false);
      } catch (error) {
        console.error("Error fetching villa locations:", error);
        setLoadingLocations(false);
      }
    };

    fetchVillaLocations();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (!termsAccepted) {
      alert("Please accept the terms and conditions.");
      return;
    }
  
    const formData = new FormData();
    formData.append("villaLocation", villaLocation);
    formData.append("roomType", roomType);
    formData.append("distance", distanceToCity);
    formData.append("pricePerDay", pricePerDay);
    formData.append("roomDescription", roomDescription);
    formData.append("amenities", JSON.stringify(amenities));
    formData.append("capacity", capacity);
  
    if (selectedFile) {
      formData.append("image", selectedFile);
    }
  
    try {
      const response = await axios.post(
        "http://localhost:3037/api/addingrooms", // Match backend route
        formData,
        { 
          headers: { 
            "Content-Type": "multipart/form-data" 
          } 
        }
      );
  
      if (response.status === 201) {
        alert("Room added successfully!");
        // Reset form state
        setVillaLocation("");
        setRoomType("");
        setDistanceToCity("");
        setPricePerDay("");
        setRoomDescription("");
        setSelectedFile(null);
        setAmenities([]);
        setTermsAccepted(false);
      }
    } catch (error) {
      console.error("Error details:", error.response?.data || error.message);
      alert(`Error: ${error.response?.data?.message || "Server error"}`);
    }
  };

  return (
    <div className="add-room-container">
      <AdminSidebar />
      <div className="room-wrapper">
        <form className="add-room-form" onSubmit={handleSubmit}>
          <h2 className="title">Add New Room</h2>

          <label className="label">
            Villa Location
            {loadingLocations ? (
              <select className="input" disabled>
                <option>Loading locations...</option>
              </select>
            ) : (
              <select
                value={villaLocation}
                onChange={(e) => setVillaLocation(e.target.value)}
                className="input"
                required
              >
                <option value="" disabled>
                  Select Villa Location
                </option>
                {villaLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
                
              </select>
            )}
          </label>

          <label className="label">
            Room Type
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="input"
              required
            >
              <option value="" disabled>
                Select Room Type
              </option>
              <option value="Family">Family</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Double">Double</option>
            </select>
          </label>

          <label className="label">
            Distance to City
            <select
              value={distanceToCity}
              onChange={(e) => setDistanceToCity(e.target.value)}
              className="input"
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
              value={pricePerDay}
              onChange={(e) => setPricePerDay(e.target.value)}
              placeholder="Enter Price Per Day"
              className="input"
              required
            />
          </label>

          <label className="label">
  Capacity (Number of Guests)
  <input
    type="number"
    min="1"
    max="4"
    value={capacity}
    onChange={(e) => setCapacity(e.target.value)}
    className="input"
    required
  />
</label>

          <label className="label">
            Room Description
            <textarea
              value={roomDescription}
              onChange={(e) => setRoomDescription(e.target.value)}
              placeholder="Enter A Short Description"
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
                <input type="checkbox" value={amenity} onChange={handleAmenityChange} /> {amenity}
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
              required
            />
          </label>

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

          <button type="submit" className="submit-button">
            Add
          </button>
        </form>

        {selectedFile && (
          <div className="preview-container">
            <h3>Preview Selected Image:</h3>
            <div className="image-preview">
              <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="preview-image" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddingRooms;
