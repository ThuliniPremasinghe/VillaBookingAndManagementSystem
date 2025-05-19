import React, { useState } from "react";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";
import "./AddingVilla.css";

function AddingVilla() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [villaLocation, setVillaLocation] = useState("");
  const [distanceToCity, setDistanceToCity] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [villaDescription, setVillaDescription] = useState("");
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [capacity, setCapacity] = useState(2);


  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleAmenitiesChange = (event) => {
    const { value, checked } = event.target;
    setAmenities((prev) =>
      checked ? [...prev, value] : prev.filter((amenity) => amenity !== value)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!villaLocation || !distanceToCity || !pricePerDay || !villaDescription  || !capacity) {
      alert("Please fill in all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("location", villaLocation);
    formData.append("distance", distanceToCity);
    formData.append("price", pricePerDay);
    formData.append("description", villaDescription);
    formData.append("amenities", JSON.stringify(amenities));
    formData.append("capacity", capacity);

    selectedFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      setLoading(true);
      const response = await axios.post("http://localhost:3037/api/addingvilla", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(response.data.message);
      setVillaLocation("");
      setDistanceToCity("");
      setPricePerDay("");
      setVillaDescription("");
      setAmenities([]);
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error adding villa:", error);
      alert("Failed to add villa. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-villa-container">
      <AdminSidebar />
      <div className="villa-wrapper">
        <form className="add-villa-form" onSubmit={handleSubmit}>
          <h2 className="title">Add New Villa</h2>

          <label className="label">
            Villa Location
            <input
              type="text"
              value={villaLocation}
              onChange={(e) => setVillaLocation(e.target.value)}
              placeholder="Enter Villa Address"
              className="input"
            />
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
            />
          </label>

          <label className="label">
  Capacity (Number of Guests)
  <input
    type="number"
    min="1"
    max="20"
    value={capacity}
    onChange={(e) => setCapacity(e.target.value)}
    placeholder="Enter maximum number of guests"
    className="input"
  />
</label>

          <div className="amenities">
            <p className="subtitle">Amenities</p>
            {["Pool", "Beach", "Kitchen", "Dedicated Workplace", "Air Conditioning", "Parking", "Room Service"].map(
              (amenity, index) => (
                <label className="checkbox" key={index}>
                  <input
                    type="checkbox"
                    value={amenity}
                    checked={amenities.includes(amenity)}
                    onChange={handleAmenitiesChange}
                  />{" "}
                  {amenity}
                </label>
              )
            )}
          </div>

          <label className="label">
            Villa Description
            <textarea
              value={villaDescription}
              onChange={(e) => setVillaDescription(e.target.value)}
              placeholder="Enter A Short Description"
              className="input textarea"
            ></textarea>
          </label>

          <label className="label">
            Add Villa Images
            <input
              type="file"
              accept="image/*"
              multiple
              className="input"
              onChange={handleFileChange}
            />
          </label>

          <div className="terms">
            <label className="checkbox">
              <input type="checkbox" required /> I have read and agreed to the Terms and
              Conditions and Privacy Policy
            </label>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Adding..." : "Add"}
          </button>
        </form>

        {selectedFiles.length > 0 && (
          <div className="preview-container">
            <h3>Preview Selected Images:</h3>
            <div className="image-preview">
              {selectedFiles.map((file, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index}`}
                  className="preview-image"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddingVilla;
