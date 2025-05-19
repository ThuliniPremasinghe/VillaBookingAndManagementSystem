import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import "./BookNow.css";

const BookNow = () => {
  const location = useLocation();
  const [villas, setVillas] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = "http://localhost:3037/api/viewvilla";

  const searchCriteria = useMemo(() => 
    location.state?.searchCriteria || {}, 
    [location.state]
  );

  const [currentSearch, setCurrentSearch] = useState({
    checkIn: searchCriteria.checkIn || '',
    checkOut: searchCriteria.checkOut || '',
    adults: searchCriteria.adults || 1,
    children: searchCriteria.children || 0,
    category: searchCriteria.category || 'villa',
    location: searchCriteria.selectedVilla || ''
  });

  // Calculate total number of guests
  const totalGuests = useMemo(() => {
    return (searchCriteria.adults || 0) + (searchCriteria.children || 0);
  }, [searchCriteria]);

  const safeJsonParse = useCallback((jsonString, defaultValue = []) => {
    if (Array.isArray(jsonString)) return jsonString;
    
    try {
      if (typeof jsonString === 'string' && jsonString.startsWith('"[') && jsonString.endsWith(']"')) {
        const unescaped = jsonString.slice(1, -1).replace(/\\"/g, '"');
        return JSON.parse(unescaped);
      }
      return JSON.parse(jsonString || JSON.stringify(defaultValue));
    } catch (error) {
      console.error("Error parsing JSON:", error, jsonString);
      return defaultValue;
    }
  }, []);

  const getVillaDistance = useCallback((villa) => {
    return villa?.distanceToCity !== undefined ? villa.distanceToCity :
           villa?.distance !== undefined ? villa.distance : "N/A";
  }, []);

  const formatVillaData = useCallback((data) => {
    return data.map((villa) => {
      try {
        const villaDistance = getVillaDistance(villa);
        return {
          ...villa,
          amenities: safeJsonParse(villa.amenities),
          distance: villaDistance,
          capacity: villa.capacity || 4, // Default villa capacity to 4
          rooms: Array.isArray(villa.rooms)
            ? villa.rooms.map((room) => ({
                ...room,
                amenities: safeJsonParse(room.amenities),
                distance: villaDistance,
                capacity: room.capacity || 2 // Default room capacity to 2
              }))
            : [],
        };
      } catch (error) {
        console.error("Error formatting villa data:", error, villa);
        return {
          ...villa,
          amenities: [],
          rooms: [],
          capacity: 4
        };
      }
    });
  }, [safeJsonParse, getVillaDistance]);

  const formatRoomData = useCallback((data) => {
    return data.map((room) => {
      try {
        const villaDistance = room.villa?.distanceToCity !== undefined ? room.villa.distanceToCity :
                              room.villa?.distance !== undefined ? room.villa.distance :
                              room.villaDistance !== undefined ? room.villaDistance : "N/A";
        
        return {
          ...room,
          amenities: safeJsonParse(room.amenities),
          villaImages: Array.isArray(room.villaImages) ? room.villaImages : [],
          distance: villaDistance,
          capacity: room.capacity || 2 // Default room capacity to 2
        };
      } catch (error) {
        console.error("Error formatting room data:", error, room);
        return {
          ...room,
          amenities: [],
          villaImages: [],
          distance: "N/A",
          capacity: 2
        };
      }
    });
  }, [safeJsonParse]);

  // Filter rooms based on guest count and capacity
  const filterRoomsByGuestCount = useCallback((room) => {
    const roomCapacity = room.capacity || 2; // Default to 2 if not specified
    return roomCapacity >= totalGuests;
  }, [totalGuests]);

  // Filter villas based on capacity and their rooms
  const filteredVillas = useMemo(() => {
    return villas
      .map(villa => ({
        ...villa,
        rooms: villa.rooms?.filter(filterRoomsByGuestCount) || []
      }))
      .filter(villa => {
        // Show villas that either have rooms or can accommodate guests directly
        const villaCapacity = villa.capacity || 4; // Default villa capacity to 4
        return villa.rooms.length > 0 || villaCapacity >= totalGuests;
      });
  }, [villas, filterRoomsByGuestCount, totalGuests]);

  // Filter standalone rooms based on capacity
  const filteredRooms = useMemo(() => {
    return rooms.filter(filterRoomsByGuestCount);
  }, [rooms, filterRoomsByGuestCount]);

  const refreshAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:3037/api/homepage", currentSearch);
      
      if (currentSearch.category === 'room') {
        setRooms(formatRoomData(response.data));
        setVillas([]);
      } else {
        setVillas(formatVillaData(response.data));
        setRooms([]);
      }
    } catch (error) {
      console.error("Error refreshing availability:", error);
      setError("Failed to refresh availability. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentSearch, formatVillaData, formatRoomData]);

  // Update the dateParams to include all search criteria
  const dateParams = useMemo(() => {
    return {
      ...currentSearch,
      checkInDate: currentSearch.checkIn,
      checkOutDate: currentSearch.checkOut,
      adults: currentSearch.adults,
      children: currentSearch.children,
      totalGuests: totalGuests
    };
  }, [currentSearch, totalGuests]);

  // Function to render booking links
  const renderBookingLink = (propertyType, id) => {
    const path = propertyType === 'villa' 
      ? `/villabookingform/${id}` 
      : `/roombookingform/${id}`;
    
    return (
      <Link 
        to={path} 
        state={{ 
          ...dateParams,
          propertyType: propertyType,
          propertyId: id
        }} 
        className="booknow-link"
      >
        <button className="booknow-btn">Book Now</button>
      </Link>
    );
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (location.state?.results && Array.isArray(location.state.results)) {
          if (location.state.results[0]?.roomType) {
            setRooms(formatRoomData(location.state.results));
            setVillas([]);
          } else {
            setVillas(formatVillaData(location.state.results));
            setRooms([]);
          }
        } 
        else if (Object.keys(searchCriteria).length > 0) {
          const response = await axios.post("http://localhost:3037/api/homepage", searchCriteria);
          if (searchCriteria.category === 'room') {
            setRooms(formatRoomData(response.data));
            setVillas([]);
          } else {
            setVillas(formatVillaData(response.data));
            setRooms([]);
          }
        } 
        else {
          const response = await axios.get(API_URL);
          setVillas(formatVillaData(response.data));
          setRooms([]);
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
        setError("Failed to fetch properties. Please try again later.");
        setVillas([]);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [location.state, searchCriteria, formatVillaData, formatRoomData, API_URL]);

  return (
    <div className="booknow-container">
      <div className="search-header">
        <h2>Available Properties</h2>
        <div className="search-summary">
          {currentSearch.checkIn && currentSearch.checkOut && (
            <p>
              {currentSearch.category === 'villa' ? 'Villas' : 'Rooms'} in 
              {currentSearch.location ? ` ${currentSearch.location}` : ' all locations'} | 
              {formatDate(currentSearch.checkIn)} to {formatDate(currentSearch.checkOut)} | 
              {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
            </p>
          )}
          <button 
            onClick={refreshAvailability}
            className="refresh-btn"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Availability'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="property-list">
        {loading ? (
          <div className="loading-container">
            <p className="loading">Loading properties...</p>
          </div>
        ) : filteredVillas.length > 0 ? (
          <div className="villa-grid">
            {filteredVillas.map((villa) => (
              <div key={villa.id} className="villa-card">
                <h3>{villa.villaLocation}</h3>
                {villa.images?.length > 0 ? (
                  <div className="villa-images">
                    {villa.images.map((image, index) => (
                      <img
                        key={index}
                        src={`http://localhost:3037${image}`}
                        alt={`Villa in ${villa.villaLocation}`}
                        className="villa-image"
                      />
                    ))}
                  </div>
                ) : <p>No images available</p>}
                
                <p><strong>Distance:</strong> {villa.distance}</p>
                <p><strong>Price:</strong> ${villa.pricePerDay} per day</p>
                <p><strong>Capacity:</strong> {villa.capacity} guests</p>
                <p><strong>Description:</strong> {villa.villaDescription}</p>
                
                <div className="villa-amenities">
                  <strong>Amenities:</strong>
                  <ul>
                    {villa.amenities?.length > 0 ? (
                      villa.amenities.map((amenity, index) => <li key={index}>{amenity}</li>)
                    ) : <li>No amenities listed</li>}
                  </ul>
                </div>

                <div className="villa-actions">
                  {renderBookingLink('villa', villa.id)}
                </div>

                {villa.rooms?.length > 0 && (
                  <div className="room-section">
                    <div className="room-list">
                      <h4>Available Rooms</h4>
                      {villa.rooms.map((room) => (
                        <div key={room.id} className="room-card">
                          <h5>{room.roomType}</h5>
                          {room.imageUrl ? (
                            <img
                              src={`http://localhost:3037${room.imageUrl}`}
                              alt={`${room.roomType} room`}
                              className="room-image"
                            />
                          ) : <p>No images available</p>}
                          
                          <p><strong>Distance:</strong> {villa.distance}</p>
                          <p><strong>Price:</strong> ${room.pricePerDay} per day</p>
                          <p><strong>Capacity:</strong> {room.capacity} guests</p>
                          <p><strong>Description:</strong> {room.roomDescription || "No description available"}</p>
                          
                          <div className="room-amenities">
                            <strong>Amenities:</strong>
                            <ul>
                              {room.amenities?.length > 0 ? (
                                room.amenities.map((amenity, index) => <li key={index}>{amenity}</li>)
                              ) : <li>No amenities listed</li>}
                            </ul>
                          </div>
                          
                          <div className="room-actions">
                            {renderBookingLink('room', room.id)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : filteredRooms.length > 0 ? (
          <div className="room-grid">
            {filteredRooms.map((room) => (
              <div key={room.id} className="room-card standalone-room">
                <h3>{room.villaLocation}</h3>
                {room.image ? (
                  <img
                    src={room.image.startsWith('http') ? room.image : `http://localhost:3037${room.image}`}
                    alt={`${room.roomType} room`}
                    className="room-image"
                  />
                ) : <p>No images available</p>}
                
                <p><strong>Distance:</strong> {room.distanceToCity}</p>
                <p><strong>Price:</strong> ${room.pricePerDay} per day</p>
                <p><strong>Capacity:</strong> {room.capacity} guests</p>
                <p><strong>Room Type:</strong> {room.roomType || "Standard Room"}</p>
                <p><strong>Description:</strong> {room.roomDescription || room.villaDescription || "No description available"}</p>
                
                <div className="room-amenities">
                  <strong>Amenities:</strong>
                  <ul>
                    {room.amenities?.length > 0 ? (
                      room.amenities.map((amenity, index) => <li key={index}>{amenity}</li>)
                    ) : <li>No amenities listed</li>}
                  </ul>
                </div>
                
                <div className="room-actions">
                  {renderBookingLink('room', room.id)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <p className="no-properties">No suitable properties available for {totalGuests} guest{totalGuests !== 1 ? 's' : ''}</p>
            <p>Please try a different search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookNow;