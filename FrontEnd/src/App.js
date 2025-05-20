import { BrowserRouter, Route, Routes,Navigate } from 'react-router-dom';
import React from 'react';
import Login from "./Components/Login/Login";
import ResetPassword from './Components/Login/ResetPassword';
import RegisterForm from "./Components/RegisterForm/RegisterForm";
import HomePage from "./Components/HomePage/HomePage";
import PropertyPage from "./Components/HomePage/PropertyPage";
import Footer from "./Components/HomePage/Footer";

import ReviewForm from './Components/HomePage/ReviewForm'; 
import ForgotPassword from "./Components/ForgotPassword/ForgotPassword";
import AdminDashboard from "./Components/AdminDashboard/AdminDashboard";
import AdminSidebar from "./Components/AdminDashboard/AdminSidebar";
import AdminBookingManagement from "./Components/AdminDashboard/AdminBookingManagement";
import AdminStaffManagement from "./Components/AdminDashboard/AdminStaffManagement";
import EditManager from "./Components/AdminDashboard/EditManager";
import EditVilla from "./Components/AdminDashboard/EditVilla";
import EditRoom from "./Components/AdminDashboard/EditRoom";
import AddManagers from "./Components/AdminDashboard/AddManagers";
import AdminVillaManagement from "./Components/AdminDashboard/AdminVillaManagement";
import ViewVilla from "./Components/AdminDashboard/ViewVilla";
import AdminManagement from "./Components/AdminDashboard/AdminManagement";

import ManagerDashboard from "./Components/ManagerDashboard/ManagerDashboard";
import ManagerSidebar from "./Components/ManagerDashboard/ManagerSidebar";
import ManagerPending from "./Components/ManagerDashboard/ManagerPending";
import ManagerCheckin from "./Components/ManagerDashboard/ManagerCheckin";
import ManagerCheckout from "./Components/ManagerDashboard/ManagerCheckout";
import ManagerCancellation from "./Components/ManagerDashboard/ManagerCancellation";
import ChargesManagement from "./Components/ManagerDashboard/ChargesManagement";
import AddingRooms from "./Components/AdminDashboard/AddingRooms";
import AddingVilla from "./Components/AdminDashboard/AddingVilla";
import RoomBookingForm from "./Components/CustomerDashboard/RoomBookingForm";
import VillaBookingForm from "./Components/CustomerDashboard/VillaBookingForm";
import Feedback from "./Components/CustomerDashboard/Feedback";
import BookNow from "./Components/CustomerDashboard/BookNow";
import FrontDeskDashboard from "./Components/FrontDesk/FrontDeskDashboard";
import FrontDeskSidebar from "./Components/FrontDesk/FrontDeskSidebar";
import FrontdeskPending from "./Components/FrontDesk/FrontdeskPending";
import FrontdeskCheckin from "./Components/FrontDesk/FrontdeskCheckin";
import FrontdeskCheckout from "./Components/FrontDesk/FrontdeskCheckout";
import FrontdeskCancellation from './Components/FrontDesk/FrontdeskCancellation';
import Payment from './Components/Payment/Payment';
import CheckoutPage from './Components/Payment/CheckoutPage';
import ReviewsDashboard from './Components/HomePage/ReviewsDashboard';
import RevenueReport from './Components/AdminDashboard/RevenueReport';
import Invoice from './Components/FrontDesk/Invoice';
import UserProfile from './Components/FrontDesk/UserProfile';
import AdminUserProfile from './Components/AdminDashboard/AdminUserProfile';
import ManagerUserProfile from './Components/ManagerDashboard/ManagerUserProfile';


import {
 
  AdminRoutes,
  ManagerRoutes,
  FrontDeskRoutes,
  CustomerRoutes
} from './Components/ProtectedRoute';


export default function Main() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/HomePage" element={<HomePage />} />
        <Route path="/propertypage" element={<PropertyPage />} />
        <Route path="/footer" element={<Footer />} />
        <Route path="/reviewsdashboard" element={<ReviewsDashboard />} />
        <Route path="/review/:villaId" element={<ReviewForm />} />
        <Route path="/booknow" element={<BookNow />} />

        {/* Admin routes */}
        <Route element={<AdminRoutes />}>
          <Route path="/admindashboard/:userId" element={<AdminDashboard />} />
          <Route path="/adminsidebar" element={<AdminSidebar />} />
          <Route path="/adminbookingmanagement" element={<AdminBookingManagement />} />
          <Route path="/adminstaffmanagement" element={<AdminStaffManagement />} />
          <Route path="/editmanager/:id" element={<EditManager />} />
          <Route path="/adminprofile/:id" element={<AdminUserProfile />} />
          <Route path="/editvilla/:id" element={<EditVilla />} />
          <Route path="/editroom/:roomId" element={<EditRoom />} />
          <Route path="/addmanagers" element={<AddManagers />} />
          <Route path="/adminvillamanagement" element={<AdminVillaManagement />} />
          <Route path="/viewvilla" element={<ViewVilla />} />
          <Route path="/adminmanagement" element={<AdminManagement />} />
          <Route path="/addingRooms" element={<AddingRooms />} />
          <Route path="/addingVilla" element={<AddingVilla />} />
          <Route path="/reports/revenue" element={<RevenueReport />} />
        </Route>

        {/* Manager routes */}
        <Route element={<ManagerRoutes />}>
          <Route path="/managerdashboard/:userId" element={<ManagerDashboard />} />
          <Route path="/managersidebar" element={<ManagerSidebar />} />
          <Route path="/managerpending" element={<ManagerPending />} />
          <Route path="/managercheckin" element={<ManagerCheckin />} />
          <Route path="/managercheckout" element={<ManagerCheckout />} />
          <Route path="/managercancellation" element={<ManagerCancellation />} />
          <Route path="/chargesmanagement" element={<ChargesManagement />} />
          <Route path="/managerprofile/:id" element={<ManagerUserProfile />} />
        </Route>

        {/* Front Desk routes */}
        <Route element={<FrontDeskRoutes />}>
          <Route path="/frontdeskdashboard/:userId" element={<FrontDeskDashboard />} />
          <Route path="/frontdesksidebar" element={<FrontDeskSidebar />} />
          <Route path="/frontdeskpending" element={<FrontdeskPending />} />
          <Route path="/frontdeskcheckin" element={<FrontdeskCheckin />} />
          <Route path="/frontdeskcheckout" element={<FrontdeskCheckout />} />
          <Route path="/frontdeskcancellation" element={<FrontdeskCancellation />} />
          <Route path="/invoice/:bookingId" element={<Invoice />} />
          <Route path="/profile/:id" element={<UserProfile />} />
        </Route>

        {/* Customer routes */}
        <Route element={<CustomerRoutes />}>
          <Route path="/villabookingform/:id" element={<VillaBookingForm />} />
          <Route path="/roombookingform/:id" element={<RoomBookingForm />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/checkoutpage" element={<CheckoutPage />} />
        </Route>

        {/* Redirect to home by default */}
        <Route path="*" element={<Navigate to="/HomePage" replace />} />
      </Routes>
    </BrowserRouter>
  );
}