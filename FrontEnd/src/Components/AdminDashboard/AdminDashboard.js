import React, { useEffect, useState } from "react";
import { 
  AiOutlineHome, 
  AiOutlineDollar,
 
  AiOutlineStar
} from "react-icons/ai";
import { 
  FaBed, 
  FaChartLine, 
  FaChartPie 
} from "react-icons/fa";
import { FaPeopleRoof } from "react-icons/fa6";
import { MdKingBed } from "react-icons/md";
import { 
  PieChart, Pie, Cell, Tooltip, Legend,
  LineChart, Line, AreaChart, Area,
  BarChart, Bar,  // Added these missing imports
  XAxis, YAxis, CartesianGrid, ResponsiveContainer 
} from "recharts";
import AdminSidebar from "./AdminSidebar";
import axios from "axios";
import "./AdminDashboard.css";

const COLORS = ["#9b59b6", "#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#1abc9c"];
const REVIEW_COLORS = [
  'rgba(40, 167, 69, 0.7)',  // 5 stars - green
  'rgba(92, 184, 92, 0.7)',  // 4 stars - light green
  'rgba(240, 173, 78, 0.7)', // 3 stars - orange
  'rgba(217, 83, 79, 0.7)',  // 2 stars - red
  'rgba(153, 0, 0, 0.7)'     // 1 star - dark red
];

const REVIEW_BORDER_COLORS = [
  'rgba(40, 167, 69, 1)',
  'rgba(92, 184, 92, 1)',
  'rgba(240, 173, 78, 1)',
  'rgba(217, 83, 79, 1)',
  'rgba(153, 0, 0, 1)'
];

const CATEGORY_COLORS = [
  'rgba(5, 85, 23, 0.7)',
  'rgba(5, 69, 122, 0.7)',
  'rgba(121, 2, 101, 0.7)',
  'rgba(154, 11, 11, 0.7)',
  'rgba(222, 198, 21, 0.7)',
  'rgba(191, 13, 150, 0.7)'
];

const CATEGORY_BORDER_COLORS = [
  'rgba(5, 85, 23, 1)',
  'rgba(5, 69, 122, 1)',
  'rgba(121, 2, 101, 1)',
  'rgba(154, 11, 11, 1)',
  'rgba(222, 198, 21, 1)',
  'rgba(191, 13, 150, 1)'
];

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    villas: 0,
    deluxeRooms: 0,
    doubleRooms: 0,
    familyRooms: 0,
    bookingTrends: [],
    bookingStatus: [],
    revenueTrends: [],
    revenueBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState({
    fullName: "User"
  });
  const [reviewData, setReviewData] = useState({
    loading: true,
    reviews: [],
    stats: null,
    error: null,
    reviewsByMonth: [],
    ratingCategories: [],
    ratingDistribution: [],
    categoryRatings: {}
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    setUserInfo({
      fullName: user.fullName || "User",
      token
    });

    const fetchDashboardData = async () => {
      try {
        const [dashboardResponse, reviewResponse] = await Promise.all([
          axios.get('http://localhost:3037/api/admin/dashboard'),
          axios.get('http://localhost:3037/api/reviews', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        ]);

        if (!dashboardResponse.data.success) {
          throw new Error(dashboardResponse.data.message || 'Invalid response format');
        }

        // Process dashboard data
        setDashboardData({
          villas: dashboardResponse.data.data.villas,
          deluxeRooms: dashboardResponse.data.data.deluxeRooms,
          doubleRooms: dashboardResponse.data.data.doubleRooms,
          familyRooms: dashboardResponse.data.data.familyRooms,
          bookingTrends: dashboardResponse.data.data.bookingTrends,
          bookingStatus: dashboardResponse.data.data.bookingStatus || [
            { name: 'Pending', value: 0 },
            { name: 'Check-in', value: 0 },
            { name: 'Check-out', value: 0 },
            { name: 'Cancelled', value: 0 }
          ],
          revenueTrends: dashboardResponse.data.data.revenueTrends,
          revenueBreakdown: dashboardResponse.data.data.revenueBreakdown || []
        });

        // Process review data
        if (reviewResponse.data) {
          const reviews = reviewResponse.data;
          const reviewsByMonth = processReviewsByMonth(reviews);
          const ratingDistribution = processRatingDistribution(reviews);
          const categoryRatings = calculateCategoryRatings(reviews);
          
          // Calculate average rating
          const averageRating = reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + review.overall_rating, 0) / reviews.length
            : 0;

          setReviewData({
            loading: false,
            reviews,
            stats: {
              totalReviews: reviews.length,
              averageRating
            },
            reviewsByMonth,
            ratingDistribution,
            categoryRatings,
            error: null
          });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(error.response?.data?.message || error.message || "Failed to load dashboard data");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper functions for review data processing
  const processReviewsByMonth = (reviews) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    const reviewsByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      reviewsByMonth.push({
        name: months[monthIndex],
        count: 0,
        averageRating: 0
      });
    }
    
    reviews.forEach(review => {
      const reviewDate = new Date(review.created_at);
      const reviewMonth = reviewDate.getMonth();
      const reviewMonthName = months[reviewMonth];
      
      const monthEntry = reviewsByMonth.find(m => m.name === reviewMonthName);
      if (monthEntry) {
        monthEntry.count++;
        monthEntry.averageRating = 
          (monthEntry.averageRating * (monthEntry.count - 1) + review.overall_rating) / monthEntry.count;
      }
    });
    
    return reviewsByMonth;
  };

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

  // Function to render stars
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

  if (loading) {
    return <div className="dashboard-container">Loading...</div>;
  }

  if (error) {
    return <div className="dashboard-container">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <AdminSidebar />
      <div className="dashboard-content">
        <header>
          <h2>Dashboard</h2>
          <span className="user">
            {userInfo.fullName} 
          </span>
        </header>

        {/* Overview Cards */}
        <div className="overview">
          <div className="card">
            <AiOutlineHome className="icon" />
            <h3>{dashboardData.villas}</h3>
            <p>Villas</p>
          </div>
          <div className="card">
            <MdKingBed className="icon" />
            <h3>{dashboardData.deluxeRooms}</h3>
            <p>Deluxe Rooms</p>
          </div>
          <div className="card">
            <FaBed className="icon" />
            <h3>{dashboardData.doubleRooms}</h3>
            <p>Double Rooms</p>
          </div>
          <div className="card">
            <FaPeopleRoof className="icon" />
            <h3>{dashboardData.familyRooms}</h3>
            <p>Family Rooms</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts">
          {/* Revenue Breakdown Pie Chart */}
          <div className="chart">
            <h3><AiOutlineDollar /> Revenue Breakdown</h3>
            {dashboardData.revenueBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.revenueBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {dashboardData.revenueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p>No revenue breakdown data available</p>
            )}
          </div>

          {/* Booking Status Pie Chart */}
          <div className="chart">
            <h3><FaChartPie /> Booking Status</h3>
            {dashboardData.bookingStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.bookingStatus}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {dashboardData.bookingStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} bookings`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p>No booking status data available</p>
            )}
          </div>

          {/* Monthly Revenue */}
          <div className="chart">
            <h3><AiOutlineDollar /> Monthly Revenue</h3>
            {dashboardData.revenueTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.revenueTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="villas" 
                    stackId="1" 
                    stroke="#9b59b6" 
                    fill="#9b59b6" 
                    name="Villas" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rooms" 
                    stackId="1" 
                    stroke="#3498db" 
                    fill="#3498db" 
                    name="Rooms" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p>No revenue data available</p>
            )}
          </div>

          {/* Booking Status Trends */}
          <div className="chart">
            <h3><FaChartLine /> Booking Status Trends</h3>
            {dashboardData.bookingTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.bookingTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="pending" 
                    stroke="#9b59b6" 
                    strokeWidth={2} 
                    name="Pending"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="checkin" 
                    stroke="#3498db" 
                    strokeWidth={2} 
                    name="Check-in"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="checkout" 
                    stroke="#2ecc71" 
                    strokeWidth={2} 
                    name="Check-out"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cancelled" 
                    stroke="#e74c3c" 
                    strokeWidth={2} 
                    name="Cancelled"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>No booking status trend data available</p>
            )}
          </div>
        </div>

        {/* Reviews Analytics Section */}
        <h2 className="section-title">Reviews Analytics</h2>
        
        {/* Reviews Overview Stats */}
        <div className="overview">
          <div className="card">
            <AiOutlineStar className="icon" />
            <h3>{reviewData.stats?.totalReviews || 0}</h3>
            <p>Total Reviews</p>
          </div>
          <div className="card">
            <AiOutlineStar className="icon" />
            <h3>{reviewData.stats?.averageRating ? reviewData.stats.averageRating.toFixed(1) : "0.0"}</h3>
            <p>Average Rating</p>
            <div className="stars-container">
              {renderStars(reviewData.stats?.averageRating || 0)}
            </div>
          </div>
        </div>
        
        {/* Review Charts - Now in one row */}
        <div className="review-charts-row">
          {/* Rating Distribution Pie Chart */}
          <div className="review-chart">
            <h3>Rating Distribution</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reviewData.ratingDistribution}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {reviewData.ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={REVIEW_COLORS[index % REVIEW_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} reviews`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Category Ratings Bar Chart with colored bars */}
          <div className="review-chart">
            <h3>Category Ratings</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={Object.entries(reviewData.categoryRatings).map(([key, value], index) => ({
                    name: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
                    value: value,
                    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value, name, props) => [
                    `${value.toFixed(1)}%`, 
                    props.payload.name
                  ]} />
                  <Legend />
                  <Bar dataKey="value" name="Rating Score">
                    {Object.entries(reviewData.categoryRatings).map(([key], index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Review Trends Chart */}
          <div className="review-chart">
            <h3>Review Trends</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reviewData.reviewsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="count" 
                    name="Number of Reviews"
                    stroke="#e74c3c" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="averageRating" 
                    name="Average Rating"
                    stroke="#2ecc71" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;