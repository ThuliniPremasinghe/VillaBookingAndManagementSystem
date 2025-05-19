import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import bodyParser from 'body-parser';
import path from "path";
import authRoutes from './routes/authRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import villaRoutes from "./routes/villaRoutes.js";
import villabookingRoutes from "./routes/bookingRoutes.js";
import searchRoutes from "./routes/searchRoutes.js"; // Add this line
import protectedRouter from "./routes/protectedRoutes.js";
import frontdeskdashboardRoutes from "./routes/frontdeskdashboardRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import managerdashboardRoutes from "./routes/managerdashboardRoutes.js";
import paymentRoutes from './routes/paymentRoutes.js'; 
import bookingRoutes from "./routes/bookingRoutes.js";
import frontdeskPendingRoutes from './routes/frontdeskPendingRoutes.js';
import adminBookingManagementRoutes from './routes/adminBookingManagementRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import chargesRoutes from './routes/chargesRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import userProfileRoutes from './routes/userProfileRoutes.js';

config();
const app = express();
const PORT = process.env.PORT || 3037;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api", protectedRouter);
app.use('/api', authRoutes);
app.use('/api/staff', staffRoutes); // For staff management endpoints
app.use('/api', roomRoutes);
app.use('/api', villaRoutes);
app.use('/api', villabookingRoutes);
app.use("/api", searchRoutes); // Add this line
app.use("/api/villabookingform", villabookingRoutes);
app.use("/api/frontdesk", frontdeskdashboardRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/manager", managerdashboardRoutes);
app.use('/api', paymentRoutes);
app.use('/api', bookingRoutes);
app.use(frontdeskPendingRoutes);
app.use(adminBookingManagementRoutes);
app.use('/api/reviews', reviewRoutes); 
app.use('/api/report', reportRoutes);
app.use('/api', chargesRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/users', userProfileRoutes);



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
