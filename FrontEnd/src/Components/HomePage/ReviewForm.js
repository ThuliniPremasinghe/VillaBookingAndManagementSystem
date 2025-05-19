import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ReviewForm.css';

const ReviewForm = () => {
  const { villaId } = useParams();
  const navigate = useNavigate();
  const [bookingInfo, setBookingInfo] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  

  const [categoryRatings, setCategoryRatings] = useState({
    cleanliness: 0,
    comfort: 0,
    location: 0,
    amenities: 0,
    valueForMoney: 0,
    staffService: 0
  });
  
  const [comment, setComment] = useState('');
  const [overallRating, setOverallRating] = useState(0);

  useEffect(() => {
    let isMounted = true; // Add mounted check to prevent state updates after unmount
    
    const verifyToken = async () => {
      try {
        if (!token) {
          throw new Error('Invalid review link - token missing');
        }
    
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:3037'}/api/reviews/verify`,
          { 
            params: { token, villaId },
            validateStatus: (status) => status < 500 // Don't throw for 400 errors
          }
        );
          
        if (isMounted) {
          if (response.data.success) {
            setBookingInfo(response.data.bookingInfo);
            setError('');
          } else {
            throw new Error(response.data.message || 'Invalid review token');
          }
        }
      } catch (err) {
        if (isMounted) {
          let errorMessage = 'An error occurred';
          
          if (err.response) {
            errorMessage = err.response.data?.message || err.message;
          } else if (err.message.includes('Network Error')) {
            errorMessage = 'Unable to connect to server. Check your internet connection.';
          } else {
            errorMessage = err.message;
          }
          
          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
  
    verifyToken();
    
    return () => {
      isMounted = false; // Cleanup function
    };
  }, [token, villaId]);

  const handleCategoryRatingChange = (category, rating) => {
    const newRatings = {
      ...categoryRatings,
      [category]: rating
    };
    setCategoryRatings(newRatings);
    
    // Calculate overall rating as average of all categories
    const total = Object.values(newRatings).reduce((sum, val) => sum + val, 0);
    setOverallRating(Math.round(total / Object.keys(newRatings).length));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Validate form data before submission
      const validationErrors = [];
      
      if (overallRating === 0) {
        validationErrors.push('Please provide ratings for all categories');
      }
  
      if (!comment.trim()) {
        validationErrors.push('Please write a review comment');
      } else if (comment.length > 2000) {
        validationErrors.push('Comment must be less than 2000 characters');
      }
  
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('\n'));
      }
  
      const reviewData = {
        cleanliness: Number(categoryRatings.cleanliness),
        comfort: Number(categoryRatings.comfort),
        location: Number(categoryRatings.location),
        amenities: Number(categoryRatings.amenities),
        valueForMoney: Number(categoryRatings.valueForMoney),
        staffService: Number(categoryRatings.staffService),
        comment: comment.trim(),
        overallRating: Number(overallRating),
        rating: Number(overallRating)
      };
  
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3037'}/api/reviews/submit/${token}`,
        reviewData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000,
          validateStatus: (status) => status < 500 // Don't throw for 400 errors
        }
      );
      
      if (response.data.success) {
        navigate('/reviewsdashboard', { 
          state: { reviewSubmitted: true }
        });
      } else {
        throw new Error(
          response.data.message || 
          (response.data.errors ? response.data.errors.join('\n') : 'Review submission failed')
        );
      }
    } catch (err) {
      let errorMessage = 'Failed to submit review';
      
      if (err.response) {
        // Handle 400-level errors specifically
        if (err.response.status === 400) {
          errorMessage = err.response.data.message || 'Invalid request data';
          if (err.response.data.errors) {
            errorMessage = err.response.data.errors.join('\n');
          }
        } else if (err.response.status === 404) {
          errorMessage = 'Review submission endpoint not found';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading) {
    return <div className="review-form-container">Loading...</div>;
  }

  if (error) {
    return (
      <div className="review-form-container">
        <h2>Review Submission Error</h2>
        <div className="error-message">{error}</div>
        <p>Token used: {token}</p>
        <p>Villa ID: {villaId}</p>
        <p>Please contact support if you believe this is an error.</p>
      </div>
    );
  }

  return (
    <div className="review-form-container">
      <h2>How was your stay, {bookingInfo?.userName}?</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="category-ratings">
          <h3>Rate your experience</h3>
          {Object.entries({
            cleanliness: 'Cleanliness',
            comfort: 'Comfort',
            location: 'Location',
            amenities: 'Amenities',
            valueForMoney: 'Value For Money',
            staffService: 'Staff Service'
          }).map(([key, label]) => (
            <div key={key} className="category-rating">
              <label>{label}</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={`${key}-${star}`}
                    className={`star ${star <= categoryRatings[key] ? 'filled' : ''}`}
                    onClick={() => handleCategoryRatingChange(key, star)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="comment-section">
          <h3>Write your review</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details of your experience..."
            rows={5}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || overallRating === 0}
          className="submit-button"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;