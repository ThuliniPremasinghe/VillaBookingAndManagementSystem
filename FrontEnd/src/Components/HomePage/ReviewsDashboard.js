import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import axios from 'axios';
import { Chart as ChartJS, registerables } from 'chart.js';
import './ReviewsDashboard.css';

// Register ChartJS components
ChartJS.register(...registerables);

const API_BASE_URL = 'http://localhost:3037';

const ReviewsDashboard = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({  // Fixed: Added 'stats' variable name
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    categoryRatings: {
      cleanliness: 0,
      comfort: 0,
      location: 0,
      amenities: 0,
      value_for_money: 0,
      staff_service: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate functions
  const calculateRatingDistribution = (reviews) => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      const roundedRating = Math.round(review.overall_rating);
      distribution[roundedRating]++;
    });
    return distribution;
  };

  const calculateCategoryRatings = (reviews) => {
    const initialCategories = {
      cleanliness: { sum: 0, count: 0 },
      comfort: { sum: 0, count: 0 },
      location: { sum: 0, count: 0 },
      amenities: { sum: 0, count: 0 },
      value_for_money: { sum: 0, count: 0 },
      staff_service: { sum: 0, count: 0 }
    };

    const categories = reviews.reduce((acc, review) => {
      ['cleanliness', 'comfort', 'location', 'amenities', 'value_for_money', 'staff_service'].forEach(category => {
        if (review[category] !== undefined) {
          acc[category].sum += review[category];
          acc[category].count++;
        }
      });
      return acc;
    }, initialCategories);

    return {
      cleanliness: categories.cleanliness.count > 0 
        ? (categories.cleanliness.sum / categories.cleanliness.count) * 20 
        : 0,
      comfort: categories.comfort.count > 0 
        ? (categories.comfort.sum / categories.comfort.count) * 20 
        : 0,
      location: categories.location.count > 0 
        ? (categories.location.sum / categories.location.count) * 20 
        : 0,
      amenities: categories.amenities.count > 0 
        ? (categories.amenities.sum / categories.amenities.count) * 20 
        : 0,
      value_for_money: categories.value_for_money.count > 0 
        ? (categories.value_for_money.sum / categories.value_for_money.count) * 20 
        : 0,
      staff_service: categories.staff_service.count > 0 
        ? (categories.staff_service.sum / categories.staff_service.count) * 20 
        : 0
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [reviewsRes, statsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/reviews`),
          axios.get(`${API_BASE_URL}/api/reviews/stats`)
        ]);

        const reviewsData = reviewsRes.data;
        const statsData = statsRes.data;

        const calculatedAvg = reviewsData.length > 0 
          ? reviewsData.reduce((sum, review) => sum + review.overall_rating, 0) / reviewsData.length
          : 0;

        setReviews(reviewsData);
        setStats({
          totalReviews: statsData.totalReviews || reviewsData.length,
          averageRating: statsData.averageRating || calculatedAvg,
          ratingDistribution: statsData.ratingDistribution || calculateRatingDistribution(reviewsData),
          categoryRatings: statsData.categoryRatings || calculateCategoryRatings(reviewsData)
        });
      } catch (err) {
        setError('Failed to load review data. Please try again later.');
        console.error('API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="loading-spinner">Loading reviews...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<span key={i} className="reviews-star reviews-star-filled">★</span>);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<span key={i} className="reviews-star reviews-star-half">★</span>);
      } else {
        stars.push(<span key={i} className="reviews-star">☆</span>);
      }
    }

    return stars;
  };

  return (
    <div className="reviews-dashboard-container">
      {/* Navbar */}
      <nav className="navbar">
        <h1 className="homepage-logo">Villa Thus</h1>
        <ul className="nav-links">
          <li><Link to="/homepage">Home</Link></li>
          <li><Link to="#">Property</Link></li>
          <li><Link to="/reviewsdashboard">Reviews</Link></li>
          <li><Link to="#">About Us</Link></li>
        </ul>
      </nav>

      {/* Dashboard Content */}
      <div className="review-dashboard-content">
        <h1>Customer Reviews</h1>

        {/* Reviews Section */}
        <div className="reviews-container">
          {reviews.map((review) => (
            <div key={review.id} className="reviews-item-card">
              <div className="reviews-item-header">
                <div className="reviews-user-info">
                  <h3>{review.user_name || review.guest_name || 'Guest User'}</h3>
                  {review.villa_name && (
                    <span className="villa-location">
                      {review.villa_name}
                    </span>
                  )}
                </div>
              </div>
              <p className="reviews-item-date">
                {new Date(review.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="reviews-item-text">{review.comment}</p>

              {/* Category Ratings */}
              <div className="reviews-categories-grid">
                {['cleanliness', 'comfort', 'location', 'amenities','value_for_money','staff_service'].map((category) => (
                  <div className="reviews-category-item" key={category}>
                    <span className="reviews-category-label">
                      {category.charAt(0).toUpperCase() + category.split('_').join(' ')}
                    </span>
                    <div className="reviews-category-stars">
                      {renderStars(review[category] || 0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewsDashboard;