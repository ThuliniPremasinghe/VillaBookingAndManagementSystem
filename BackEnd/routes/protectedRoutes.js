import { Router } from "express";
import { roleMiddleware as checkRole } from "../middleware/authMiddleware.js"; // Correct import

const router = Router();

// Admin-only route
router.get("/admindashboard", checkRole('admin'), (req, res) => {
  res.json({ message: "Welcome to Admin Dashboard" });
});

// Manager-only route
router.get("/managerdashboard", checkRole('manager'), (req, res) => {
  res.json({ message: "Manager Reports" });
});

// Frontdesk-only route
router.post("/frontdeskdashboard", checkRole('frontdesk'), (req, res) => {
  res.json({ message: "Guest checked in successfully" });
});

export default router;