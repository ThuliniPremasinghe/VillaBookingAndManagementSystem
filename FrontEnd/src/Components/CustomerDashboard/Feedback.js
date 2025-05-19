import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import "./Feedback.css"; // Import CSS file
import {  AiOutlineUser } from "react-icons/ai";


const RatingForm = () => {
  const [ratings, setRatings] = useState({
    overall: 5,
    cleanliness: 4,
    comfort: 4,
    location: 3,
    amenities: 4,
    valueForMoney: 5,
    staffService: 5,
  });

  const [comment, setComment] = useState("");

  const handleStarClick = (category, value) => {
    setRatings({ ...ratings, [category]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted Ratings:", ratings);
    console.log("Comment:", comment);
    alert("Review Submitted!");
  };

  return (

   <div className="feedback-content">
    
      <div className="rating-wrapper">
        <header>
          <h2>Feedback</h2>
          <span className="user">Thulini Premasinghe <AiOutlineUser className="user-icon" /></span>
          
        </header>
    <div className="rating-container">
      <form onSubmit={handleSubmit} className="rating-form">
        <h2>Overall Rating: {ratings.overall.toFixed(1)}</h2>
        
        {[
          "cleanliness",
          "comfort",
          "location",
          "amenities",
          "valueForMoney",
          "staffService",
        ].map((category) => (
          <div key={category} className="rating-row">
            <label>{category.replace(/([A-Z])/g, " $1")}: </label>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <FontAwesomeIcon
                  key={star}
                  icon={faStar}
                  className={star <= ratings[category] ? "star active" : "star"}
                  onClick={() => handleStarClick(category, star)}
                />
              ))}
            </div>
          </div>
        ))}

        <textarea
          placeholder="Write your review..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        ></textarea>

        <button type="submit">Submit</button>
      </form>
    </div>
    </div>
    </div>
  );
};

export default RatingForm;
