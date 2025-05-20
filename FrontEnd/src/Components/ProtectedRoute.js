// src/components/ProtectedRoute.js
import { Navigate, Outlet } from 'react-router-dom';


const ProtectedRoute = ({ allowedRoles }) => {
 
  const user = JSON.parse(localStorage.getItem('user')); // If using localStorage
  
  if (!user) {
    // User not logged in - redirect to login
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    // User doesn't have required role - redirect to unauthorized or home
    return <Navigate to="/HomePage" replace />;
    // Alternatively, create an Unauthorized page:
    // return <Navigate to="/unauthorized" replace />;
  }
  
  // User has required role - render child routes
  return <Outlet />;
};

export default ProtectedRoute;

// Role-specific route components
export const AdminRoutes = () => (
  <ProtectedRoute allowedRoles={['admin']} />
);

export const ManagerRoutes = () => (
  <ProtectedRoute allowedRoles={['manager']} />
);

export const FrontDeskRoutes = () => (
  <ProtectedRoute allowedRoles={['frontdesk', 'frontDesk', 'front-desk', 'front_desk']} />
);

export const CustomerRoutes = () => (
  <ProtectedRoute allowedRoles={['customer']} />
);