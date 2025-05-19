import express from 'express';
import { getFrontDeskDashboardData } from '../controllers/frontdeskdashboardController.js';

const router = express.Router();

// Front Desk Dashboard Endpoint
router.get('/dashboard', getFrontDeskDashboardData);

export default router;