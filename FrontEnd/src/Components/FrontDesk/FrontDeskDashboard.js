import React, { useEffect, useState } from "react";
import { AiOutlineCalendar, AiOutlineCheckCircle, AiOutlineCloseCircle, AiOutlineStop } from "react-icons/ai";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import FrontDeskSidebar from "./FrontDeskSidebar";
import axios from "axios";
import "./FrontDeskDashboard.css";

const COLORS = [ "#9b59b6", "#3498db", "#2ecc71", "#e74c3c"];

const CATEGORY_COLORS = [
  '#CC1A4A', // Dark Pink (Cleanliness - 20% darker)
  '#1E78C8', // Dark Blue (Comfort - 20% darker)
  '#D9A82B', // Dark Yellow (Location - 15% darker)
  '#2F9D9D', // Dark Teal (Amenities - 20% darker)
  '#7A4DCC', // Dark Purple (Value for Money - 20% darker)
  '#D97D1A'  // Dark Orange (Staff Service - 15% darker)
];


const FrontDeskDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState({
    userId: null,
    villaId: null,
    villaLocation: null,
    fullName: "User"
  });

  const [reviewData, setReviewData] = useState({
      loading: true,
      reviews: [],
      stats: null,
      error: null
    });
  
  useEffect(() => {
    // Get authentication and user data from localStorage
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const villaId = localStorage.getItem("villaId");
    const villaLocation = localStorage.getItem("villaLocation");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    setUserInfo({
      userId,
      villaId,
      villaLocation,
      token,
      fullName: user.fullName || "User"
    });

    if (!token || !userId) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }
  }, []);

  useEffect(() => {
    // Only fetch data once user info is available
    if (!userInfo.token || !userInfo.userId) return;

    const fetchDashboardData = async () => {
      try {
        // Create endpoint URL - use the original endpoint that was working before
        // The backend likely expects the villa ID as a query parameter
        const url = 'http://localhost:3037/api/frontdesk/dashboard';
        
        // Prepare request config with headers and possible query parameters
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          },
          params: userInfo.villaId ? { villaId: userInfo.villaId } : {}
        };

        const response = await axios.get(url, config);
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'Invalid response format');
        }

        setDashboardData(response.data.data);
      } catch (error) {
        console.error("Dashboard Error:", error);
        setError(error.response?.data?.message || error.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userInfo]);

  // Fetch review data
    useEffect(() => {
      if (!userInfo.token || !userInfo.userId) return;
  
      const fetchReviewData = async () => {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${userInfo.token}`
            }
          };
  
          // Fetch reviews and stats in parallel
          const [reviewsResponse, statsResponse] = await Promise.all([
            axios.get('http://localhost:3037/api/reviews', config),
            axios.get('http://localhost:3037/api/reviews/stats', config)
          ]);
  
          // Process reviews to prepare data for charts
          const reviews = reviewsResponse.data;
          
          // Process review data by month for the trend chart
          const reviewsByMonth = processReviewsByMonth(reviews);
          
          // Process rating categories for radar chart
          const ratingCategories = processRatingCategories(reviews);
          
          // Process rating distribution for charts
          const ratingDistribution = processRatingDistribution(reviews);
  
          // Calculate average rating
          const averageRating = reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + review.overall_rating, 0) / reviews.length
            : 0;
          
          // Calculate category ratings percentages (0-100 scale)
          const categoryRatings = calculateCategoryRatings(reviews);
  
          setReviewData({
            loading: false,
            reviews,
            stats: {
              ...statsResponse.data,
              totalReviews: reviews.length,
              averageRating
            },
            reviewsByMonth,
            ratingCategories,
            ratingDistribution,
            categoryRatings,
            error: null
          });
        } catch (error) {
          console.error("Review data error:", error);
          setReviewData({
            loading: false,
            reviews: [],
            stats: null,
            error: error.response?.data?.message || error.message || "Failed to load review data"
          });
        }
      };
  
      fetchReviewData();
    }, [userInfo]);
  
    // Helper function to process reviews by month
    const processReviewsByMonth = (reviews) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      
      // Initialize last 6 months data
      const reviewsByMonth = [];
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        reviewsByMonth.push({
          name: months[monthIndex],
          count: 0,
          averageRating: 0
        });
      }
      
      // Populate with actual data
      reviews.forEach(review => {
        const reviewDate = new Date(review.created_at);
        const reviewMonth = reviewDate.getMonth();
        const reviewMonthName = months[reviewMonth];
        
        // Check if this review falls within our 6-month window
        const monthEntry = reviewsByMonth.find(m => m.name === reviewMonthName);
        if (monthEntry) {
          monthEntry.count++;
          monthEntry.averageRating = 
            (monthEntry.averageRating * (monthEntry.count - 1) + review.overall_rating) / monthEntry.count;
        }
      });
      
      return reviewsByMonth;
    };
  
    // Helper function to process rating categories for radar chart
    const processRatingCategories = (reviews) => {
      if (!reviews.length) return [];
      
      const categories = {
        cleanliness: 0,
        comfort: 0,
        location: 0,
        amenities: 0,
        value_for_money: 0,
        staff_service: 0
      };
      
      reviews.forEach(review => {
        categories.cleanliness += review.cleanliness || 0;
        categories.comfort += review.comfort || 0;
        categories.location += review.location || 0;
        categories.amenities += review.amenities || 0;
        categories.value_for_money += review.value_for_money || 0;
        categories.staff_service += review.staff_service || 0;
      });
      
      // Calculate averages
      const count = reviews.length;
      return [
        { subject: 'Cleanliness', A: categories.cleanliness / count, fullMark: 5 },
        { subject: 'Comfort', A: categories.comfort / count, fullMark: 5 },
        { subject: 'Location', A: categories.location / count, fullMark: 5 },
        { subject: 'Amenities', A: categories.amenities / count, fullMark: 5 },
        { subject: 'Value', A: categories.value_for_money / count, fullMark: 5 },
        { subject: 'Service', A: categories.staff_service / count, fullMark: 5 }
      ];
    };
  
    // Helper function to process rating distribution for pie chart
    const processRatingDistribution = (reviews) => {
      const distribution = [
        { name: '5★', count: 0, label: '5 Stars' },
        { name: '4★', count: 0, label: '4 Stars' },
        { name: '3★', count: 0, label: '3 Stars' },
        { name: '2★', count: 0, label: '2 Stars' },
        { name: '1★', count: 0, label: '1 Star' }
      ];
      
      reviews.forEach(review => {
        const rating = Math.round(review.overall_rating);
        if (rating >= 1 && rating <= 5) {
          distribution[5 - rating].count++;
        }
      });
      
      return distribution;
    };
  
    // Calculate category ratings on a 0-100 scale (consistent with ReviewsDashboard)
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

  const prepareDailyStatsData = () => {
    if (!dashboardData?.dailyStats) return [];
    return dashboardData.dailyStats.map(day => ({
      date: day.date.split('-').slice(1).join('/'), // Format as MM/DD
      pendings: day.pendings || 0,
      checkIns: day.checkIns || 0,
      checkOuts: day.checkOuts || 0
    }));
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <FrontDeskSidebar />
        <div className="dashboard-content">
          <div className="loading-spinner">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <FrontDeskSidebar />
        <div className="dashboard-content">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-container">
        <FrontDeskSidebar />
        <div className="dashboard-content">
          <div className="error-message">No dashboard data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <FrontDeskSidebar />
      <div className="dashboard-content">
        <header>
          <h2>
            Dashboard {userInfo.villaId && `- ${userInfo.villaLocation || `Villa ID: ${userInfo.villaId}`}`}
          </h2>
          <span className="user">{userInfo.fullName} </span>
        </header>

        <div className="overview">
          <div className="card">
            <AiOutlineCalendar className="icon" />
            <h3>{dashboardData.totalPendings || 0}</h3>
            <p>Total Pendings</p>
          </div>
          <div className="card">
            <AiOutlineCheckCircle className="icon" />
            <h3>{dashboardData.totalCheckIn || 0}</h3>
            <p>Total Check-In</p>
          </div>
          <div className="card">
            <AiOutlineCloseCircle className="icon" />
            <h3>{dashboardData.totalCheckOut || 0}</h3>
            <p>Total Check-Out</p>
          </div>
          <div className="card">
            <AiOutlineStop className="icon" />
            <h3>{dashboardData.cancellations || 0}</h3>
            <p>Cancellations</p>
          </div>
        </div>

        <div className="charts-row">

        
          <div className="chart">
            <h3>Daily Status (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={prepareDailyStatsData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pendings" name="Pending" stroke="#111" strokeWidth={2} />
                <Line type="monotone" dataKey="checkIns" name="Check-In" stroke="#3498db" strokeWidth={2} />
                <Line type="monotone" dataKey="checkOuts" name="Check-Out" stroke="#9b59b6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart">
            <h3>Booking Categories</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.bookingCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pendings" name="Pending" fill="#111" />
                <Bar dataKey="checkIns" name="Check-In" fill="#3498db" />
                <Bar dataKey="checkOuts" name="Check-Out" fill="#9b59b6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
         
          
                    {/* Category Ratings Bar Chart */}
                    {reviewData.categoryRatings && (
                      <div className="chart">
                        <h3>Category Ratings</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={Object.entries(reviewData.categoryRatings).map(([key, value], index) => ({
                            name: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                            value: value,
                            fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{fontSize: 10}} angle={-45} textAnchor="end" height={60} />
                            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                            <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Rating']} />
                            <Legend />
                            <Bar dataKey="value" name="Rating Score" fill={(entry) => entry.fill} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
       
     
  );
};
export default FrontDeskDashboard;
