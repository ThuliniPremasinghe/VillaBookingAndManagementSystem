import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";
import "./AddingVilla.css";

const EditVilla = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [villa, setVilla] = useState({
    villaLocation: "",
    distanceToCity: "",
    pricePerDay: "",
    villaDescription: "",
    amenities: [],
    images: [],
    capacity: 2,
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    console.log("Fetching villa with ID:", id);
    axios.get(`http://localhost:3037/api/villa/${id}`)
      .then((response) => {
        console.log("Villa Data:", response.data);
        setVilla({
          villaLocation: response.data.villaLocation,
          distanceToCity: response.data.distanceToCity,
          pricePerDay: response.data.pricePerDay,
          villaDescription: response.data.villaDescription,
          amenities: response.data.amenities || [],
          images: response.data.images || [],
          capacity: response.data.capacity || 2,
        });
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching villa:", error);
        alert("Failed to fetch villa details. Please try again.");
        setLoading(false);
      });
  }, [id]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    
    // Create preview URLs for selected files
    const newPreviewImages = files.map(file => URL.createObjectURL(file));
    setPreviewImages(newPreviewImages);
  };

  const handleAmenitiesChange = (event) => {
    const { value, checked } = event.target;
    setVilla((prev) => ({
      ...prev,
      amenities: checked
        ? [...prev.amenities, value]
        : prev.amenities.filter((amenity) => amenity !== value),
    }));
  };

  const handleChange = (e) => {
    setVilla({ ...villa, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!villa.villaLocation || !villa.distanceToCity || !villa.pricePerDay || !villa.villaDescription || !villa.capacity) {
      alert("Please fill in all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("location", villa.villaLocation);
    formData.append("distance", villa.distanceToCity);
    formData.append("price", villa.pricePerDay);
    formData.append("description", villa.villaDescription);
    formData.append("amenities", JSON.stringify(villa.amenities));
    formData.append("existingImages", JSON.stringify(villa.images)); // Keep existing images
    formData.append("capacity", villa.capacity);

    selectedFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      setSubmitting(true);
      const response = await axios.put(
        `http://localhost:3037/api/editvilla/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert(response.data.message);
      navigate("/viewvilla");
    } catch (error) {
      console.error("Error updating villa:", error);
      alert("Failed to update villa. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Clean up URL objects to prevent memory leaks
  useEffect(() => {
    return () => {
      previewImages.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewImages]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading villa details...</p>
      </div>
    );
  }

  return (
    <div className="add-villa-container">
      <AdminSidebar />
      <div className="villa-wrapper">
        <form className="add-villa-form" onSubmit={handleUpdate}>
          <h2 className="title">Edit Villa</h2>

          <label className="label">
            Villa Location
            <input
              type="text"
              name="villaLocation"
              value={villa.villaLocation}
              onChange={handleChange}
              className="input"
              required
            />
          </label>

          <label className="label">
            Distance to City
            <select 
              name="distanceToCity" 
              value={villa.distanceToCity} 
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
              value={villa.pricePerDay} 
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
              max="20"
              value={villa.capacity}
              onChange={handleChange}
              className="input"
              required
            />
          </label>

          <div className="amenities">
            <p className="subtitle">Amenities</p>
            {["Pool", "Beach", "Kitchen", "Dedicated Workplace", "Air Conditioning", "Parking", "Room Service"].map(
              (amenity, index) => (
                <label key={index} className="checkbox">
                  <input 
                    type="checkbox" 
                    value={amenity} 
                    checked={villa.amenities.includes(amenity)} 
                    onChange={handleAmenitiesChange} 
                  />
                  {amenity}
                </label>
              )
            )}
          </div>

          <label className="label">
            Villa Description
            <textarea 
              name="villaDescription" 
              value={villa.villaDescription} 
              onChange={handleChange} 
              className="input textarea"
              required
            ></textarea>
          </label>

          <label className="label">
            Add New Villa Images
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              className="input" 
              onChange={handleFileChange} 
            />
          </label>

          {villa.images && villa.images.length > 0 && (
            <div className="current-images">
              <h3>Current Images:</h3>
              <div className="image-gallery">
                {villa.images.map((image, index) => (
                  <div key={index} className="image-container">
                    <img 
                      src={`http://localhost:3037${image}`} 
                      alt={`Villa ${index + 1}`} 
                      className="preview-image" 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {previewImages.length > 0 && (
            <div className="new-images">
              <h3>New Images Preview:</h3>
              <div className="image-gallery">
                {previewImages.map((url, index) => (
                  <div key={index} className="image-container">
                    <img 
                      src={url} 
                      alt={`New upload ${index + 1}`} 
                      className="preview-image" 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="submit-button" 
            disabled={submitting}
          >
            {submitting ? "Updating..." : "Update Villa"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditVilla;