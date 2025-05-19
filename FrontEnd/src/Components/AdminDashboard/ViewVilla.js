import "./ViewVilla.css";
import { AiOutlineUser } from "react-icons/ai";
import AdminSidebar from "./AdminSidebar";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ViewVilla = () => {
  const [villas, setVillas] = useState([]);
  const API_URL = "http://localhost:3037/api/viewvilla";
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL);
        if (Array.isArray(response.data)) {
          const formattedVillas = response.data.map((villa) => ({
            ...villa,
            amenities: Array.isArray(villa.amenities)
              ? villa.amenities
              : JSON.parse(villa.amenities || "[]"),
            rooms: Array.isArray(villa.rooms)
              ? villa.rooms.map((room) => ({
                  ...room,
                  amenities: Array.isArray(room.amenities)
                    ? room.amenities
                    : JSON.parse(room.amenities || "[]"),
                }))
              : [],
          }));
          setVillas(formattedVillas);
        } else {
          console.error("Invalid response format:", response.data);
          setVillas([]);
        }
      } catch (error) {
        console.error("Error fetching villas:", error);
      }
    };

    fetchData();
  }, []);

  const deleteVilla = async (villaId) => {
    if (window.confirm("Are you sure you want to delete this villa and all its rooms?")) {
      try {
        const response = await axios.delete(
          `http://localhost:3037/api/deleteVilla/${villaId}`
        );
        
        if (response.status === 200) {
          setVillas((prevVillas) => 
            prevVillas.filter((villa) => villa.id !== villaId)
          );
          alert('Villa deleted successfully');
        }
      } catch (error) {
        console.error("Full error object:", error);
        
        let errorMessage = "Failed to delete villa";
        if (error.response) {
          // The request was made and the server responded with a status code
          console.error("Server response data:", error.response.data);
          errorMessage = error.response.data.message || errorMessage;
          
          if (error.response.data.error) {
            errorMessage += `: ${error.response.data.error}`;
          }
        } else if (error.request) {
          // The request was made but no response was received
          console.error("No response received:", error.request);
          errorMessage = "No response from server";
        } else {
          // Something happened in setting up the request
          console.error("Request setup error:", error.message);
          errorMessage = error.message;
        }
        
        alert(errorMessage);
      }
    }
  };

  // Delete room (only deletes the specific room)
  const deleteRoom = async (villaId, roomId) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      try {
        await axios.delete(`http://localhost:3037/api/deleteroom/${roomId}`);
        setVillas((prevVillas) =>
          prevVillas.map((villa) =>
            villa.id === villaId
              ? { ...villa, rooms: villa.rooms.filter((room) => room.id !== roomId) }
              : villa
          )
        );
      } catch (error) {
        console.error("Error deleting room:", error);
      }
    }
  };

  return (
    <div className="ViewVilla-container">
      <AdminSidebar />
      <div className="ViewVilla-wrapper">
        <div className="ViewVilla-header">
          <h2>View Villas</h2>
          <div className="user-info">
            <span className="user-name">Admin</span>
            <AiOutlineUser className="user-icon" />
          </div>
        </div>

        <div className="villa-list">
          {villas.length > 0 ? (
            <div className="villa-grid">
              {villas.map((villa) => (
                <div key={villa.id} className="villa-card">
                  <h3>{villa.villaLocation}</h3>
                  {villa.images && villa.images.length > 0 ? (
                    <div className="villa-images">
                      {villa.images.map((image, index) => (
                        <img
                          key={index}
                          src={`http://localhost:3037${image}`}
                          alt="Villa"
                          className="villa-image"
                        />
                      ))}
                    </div>
                  ) : (
                    <p>No images available</p>
                  )}
                  <p><strong>Distance:</strong> {villa.distanceToCity || "N/A"} </p>
                  <p>
                    <strong>Price:</strong> ${villa.pricePerDay}
                  </p>
                  <p><strong>Capacity:</strong> {villa.capacity} guests</p>
                  <p>
                    <strong>Description:</strong> {villa.villaDescription}
                  </p>
                  <p><strong>Amenities:</strong></p>
                  <div className="villa-amenities">
                    <ul>
                      {villa.amenities.length > 0 ? (
                        villa.amenities.map((amenity, index) => <li key={index}>{amenity}</li>)
                      ) : (
                        <li>No amenities listed</li>
                      )}
                    </ul>
                  </div>

                  <div className="villa-actions">
                    <button
                      className="edit-btn"
                      onClick={() => navigate(`/editvilla/${villa.id}`)}
                    >
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => deleteVilla(villa.id)}>
                      Delete
                    </button>
                  </div>

                  <div className="room-section">
                    {villa.rooms.length > 0 ? (
                      <div className="room-list">
                        {villa.rooms.map((room) => (
                          <div key={room.id} className="room-card">
                            <h5>{room.roomType}</h5>
                            {room.imageUrl ? (
                              <img
                                src={`http://localhost:3037${room.imageUrl}`}
                                alt="Room"
                                className="room-image"
                              />
                            ) : (
                              <p>No images available</p>
                            )}

<p><strong>Distance:</strong> {room.distance || "N/A"} </p>
                            <p>
                              <strong>Price:</strong> ${room.pricePerDay} per day
                            </p>
                            <p><strong>Capacity:</strong> {room.capacity} guests</p>
                            <p>
                              <strong>Description:</strong> {room.roomDescription}
                            </p>
                            <p><strong>Amenities:</strong></p>
                            <div className="room-amenities">
                              <ul>
                                {Array.isArray(room.amenities) && room.amenities.length > 0 ? (
                                  room.amenities.map((amenity, index) => <li key={index}>{amenity}</li>)
                                ) : (
                                  <li>No amenities listed</li>
                                )}
                              </ul>
                            </div>
                            <div className="room-actions">
                              <button
                                className="edit-btn"
                                onClick={() => navigate(`/editroom/${room.id}`)}
                              >
                                Edit
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => deleteRoom(villa.id, room.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No rooms available in this villa</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-villas">No villas available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewVilla;
