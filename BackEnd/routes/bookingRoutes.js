import express from 'express';
import { createBooking, getBookedDates,getAvailability,checkOutBooking } from '../controllers/bookingController.js';
import { cancelBooking } from '../controllers/bookingController.js';

const router = express.Router();

// Room booking routes
router.post('/roombookingform', createBooking); // Note: removed /api prefix here
router.get('/roombookingform/:id/dates', getBookedDates);

// Villa booking routes
router.post('/villabookingform', createBooking);
router.get('/villabookingform/:id/dates', getBookedDates);

// Updated route path (removed /api prefix)
router.get('/bookings/availability', getAvailability);

// Keep this route as is if it's registered separately
router.put('/bookings/:id/cancel', cancelBooking);

router.put('/bookings/:id/checkout', checkOutBooking);

// Availability routes
router.get('/bookings/availability', getAvailability);





export default router;