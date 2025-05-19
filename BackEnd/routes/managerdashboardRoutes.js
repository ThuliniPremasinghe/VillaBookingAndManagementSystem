import express from 'express';
import { getManagerDashboardData } from '../controllers/managerdashboardController.js';

const router = express.Router();

// Manager dashboard route
router.get('/', getManagerDashboardData);

export default router;