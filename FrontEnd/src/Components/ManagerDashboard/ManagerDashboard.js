import React, { useEffect, useState } from "react";
import { 
  AiOutlineCalendar, 
  AiOutlineCheckCircle, 
  AiOutlineCloseCircle,
  AiOutlineUser
} from "react-icons/ai";
import { 
  PieChart, Pie, Cell, Tooltip, Legend,
  LineChart, Line, 
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, 
} from "recharts";
import ManagerSidebar from "./ManagerSidebar";
import axios from "axios";
import "./ManagerDashboard.css";

const COLORS = [ "#9b59b6", "#3498db", "#2ecc71", "#e74c3c"];

// Updated category colors with more distinct variety
const CATEGORY_COLORS = [
  '#CC1A4A', // Dark Pink (Cleanliness - 20% darker)
  '#1E78C8', // Dark Blue (Comfort - 20% darker)
  '#D9A82B', // Dark Yellow (Location - 15% darker)
  '#2F9D9D', // Dark Teal (Amenities - 20% darker)
  '#7A4DCC', // Dark Purple (Value for Money - 20% darker)
  '#D97D1A'  // Dark Orange (Staff Service - 15% darker)
];



const ManagerDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    loading: true,
    data: null,
    error: null
  });
  const [userData, setUserData] = useState({
    userId: null,
    villaLocation: null,
    token: null,

  });
  const [reviewData, setReviewData] = useState({
    loading: true,
    reviews: [],
    stats: null,
    error: null
  });

  useEffect(() => {
    // Get the user data from localStorage
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const villaLocation = localStorage.getItem("villaLocation");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    setUserData({
      userId,
      villaLocation,
      token,
      fullName: user.fullName || "User",
     
    });

    if (!token || !userId) {
      setDashboardData({
        loading: false,
        data: null,
        error: "Authentication required. Please log in."
      });
      return;
    }
  }, []);

  useEffect(() => {
    if (!userData.token || !userData.userId) return;

    const fetchDashboardData = async () => {
      try {
        const url = 'http://localhost:3037/api/manager';
        
        const config = {
          headers: {
            Authorization: `Bearer ${userData.token}`
          },
          params: userData.villaLocation ? { villaLocation: userData.villaLocation } : {}
        };

        const response = await axios.get(url, config);

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to fetch dashboard data");
        }

        setDashboardData({
          loading: false,
          data: response.data.data,
          error: null
        });
      } catch (error) {
        console.error("Dashboard error:", error);
        setDashboardData({
          loading: false,
          data: null,
          error: error.response?.data?.message || error.message || "Failed to load dashboard data"
        });
      }
    };

    fetchDashboardData();
  }, [userData]);

  // Fetch review data
  useEffect(() => {
    if (!userData.token || !userData.userId) return;

    const fetchReviewData = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userData.token}`
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
  }, [userData]);

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

  
  if (dashboardData.loading || reviewData.loading) {
    return (
      <div className="dashboard-container">
        <ManagerSidebar />
        <div className="dashboard-content">
          <div className="loading">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="dashboard-container">
        <ManagerSidebar />
        <div className="dashboard-content">
          <div className="error-message">Error: {dashboardData.error}</div>
        </div>
      </div>
    );
  }

  const data = dashboardData.data;

  return (
    <div className="dashboard-container">
      <ManagerSidebar />
      <div className="dashboard-content">
        <header>
          <h2>Dashboard {userData.villaLocation && `- ${userData.villaLocation}`}</h2>
          <span className="user">{userData.fullName} 
          </span>
        </header>

        {/* Overview Cards */}
        <div className="overview">
          <div className="card">
            <AiOutlineUser className="icon" />
            <h3>{data.totalBookings}</h3>
            <p>Total Bookings</p>
          </div>
          <div className="card">
            <AiOutlineCalendar className="icon" />
            <h3>{data.pendingBookings || 0}</h3>
            <p>Pending Bookings</p>
          </div>
          <div className="card">
            <AiOutlineCheckCircle className="icon" />
            <h3>{data.completedBookings}</h3>
            <p>Completed Bookings</p>
          </div>
          <div className="card">
            <AiOutlineCloseCircle className="icon" />
            <h3>{data.cancelledBookings}</h3>
            <p>Cancelled Bookings</p>
          </div>
        </div>

        {/* All Charts in Single Row */}
        <div className="charts-row">
          {/* Booking Trends Line Chart */}
          <div className="chart">
            <h3>Booking Trends</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.bookingTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="villa" 
                  name="Villa"
                  stroke="#9b59b6" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="room" 
                  name="Room"
                  stroke="#3498db" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Booking Categories Pie Chart */}
          <div className="chart">
            <h3>Booking Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.bookingCategories}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.bookingCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} bookings`, 'Count']} />
                <Legend />
              </PieChart>
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

export default ManagerDashboard;