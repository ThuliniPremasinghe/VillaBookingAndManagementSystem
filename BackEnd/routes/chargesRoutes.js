// routes/chargesRoutes.js
import express from 'express';
import {
  getAllCharges,
  createCharge,
  updateCharge,
  deleteCharge
} from '../controllers/chargesController.js';

const router = express.Router();

// Get all charges
router.get('/charges', getAllCharges);

// Create a new charge
router.post('/charges', createCharge);

// Update a charge
router.put('/charges/:id', updateCharge);

// Delete a charge
router.delete('/charges/:id', deleteCharge);

export default router;