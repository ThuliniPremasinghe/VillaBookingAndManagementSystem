import express from 'express';
import { verifyReviewToken, submitReview, getAllReviews, getReviewStats } from '../controllers/reviewController.js';

const router = express.Router();

// Changed from path params to query params to match the controller
router.get('/verify', verifyReviewToken);
router.post('/submit/:token', submitReview);
router.get('/', getAllReviews);
router.get('/stats', getReviewStats);

export default router;