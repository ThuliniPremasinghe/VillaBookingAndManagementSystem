import express from 'express';
import { getAdminDashboardData } from '../controllers/adminDashboardController.js';

const router = express.Router();

// Admin Dashboard Endpoint
router.get('/dashboard', getAdminDashboardData);

export default router;