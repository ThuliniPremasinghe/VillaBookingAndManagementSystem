// controllers/chargesController.js
import * as chargesModel from '../models/chargesModel.js';

// Get all charges across all categories
export const getAllCharges = async (req, res) => {
  try {
    const fees = await chargesModel.getChargesByCategory('fee');
    const taxes = await chargesModel.getChargesByCategory('tax');
    const services = await chargesModel.getChargesByCategory('service');
    const mealPlans = await chargesModel.getMealPlans();
    const transportation = await chargesModel.getTransportation();
    const specialPeriods = await chargesModel.getSpecialPeriods();

    res.json({
      fees,
      taxes,
      services,
      mealPlans,
      transportation,
      specialPeriods
    });
  } catch (error) {
    console.error('Error fetching charges:', error);
    res.status(500).json({ message: 'Error fetching charges', error: error.message });
  }
};

// Create a new charge based on category
export const createCharge = async (req, res) => {
  try {
    const { category, data } = req.body;
    let result;

    switch (category) {
      case 'fees':
      case 'taxes':
      case 'services':
        result = await chargesModel.createAdditionalCharge(data);
        break;
      case 'mealPlans':
        result = await chargesModel.createMealPlan(data);
        break;
      case 'transportation':
        result = await chargesModel.createTransportation(data);
        break;
      case 'specialPeriods':
        result = await chargesModel.createSpecialPeriod(data);
        break;
      default:
        return res.status(400).json({ message: 'Invalid category' });
    }

    res.status(201).json({ message: 'Charge created successfully', data: result });
  } catch (error) {
    console.error('Error creating charge:', error);
    res.status(500).json({ message: 'Error creating charge', error: error.message });
  }
};

// Update a charge by ID
export const updateCharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, data } = req.body;
    let result;

    switch (category) {
      case 'fees':
      case 'taxes':
      case 'services':
        result = await chargesModel.updateAdditionalCharge(id, data);
        break;
      case 'mealPlans':
        result = await chargesModel.updateMealPlan(id, data);
        break;
      case 'transportation':
        result = await chargesModel.updateTransportation(id, data);
        break;
      case 'specialPeriods':
        result = await chargesModel.updateSpecialPeriod(id, data);
        break;
      default:
        return res.status(400).json({ message: 'Invalid category' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Charge not found' });
    }

    res.json({ message: 'Charge updated successfully' });
  } catch (error) {
    console.error('Error updating charge:', error);
    res.status(500).json({ message: 'Error updating charge', error: error.message });
  }
};

// Delete a charge by ID
export const deleteCharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.query;
    let result;

    switch (category) {
      case 'fees':
      case 'taxes':
      case 'services':
        result = await chargesModel.deleteAdditionalCharge(id);
        break;
      case 'mealPlans':
        result = await chargesModel.deleteMealPlan(id);
        break;
      case 'transportation':
        result = await chargesModel.deleteTransportation(id);
        break;
      case 'specialPeriods':
        result = await chargesModel.deleteSpecialPeriod(id);
        break;
      default:
        return res.status(400).json({ message: 'Invalid category' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Charge not found' });
    }

    res.json({ message: 'Charge deleted successfully' });
  } catch (error) {
    console.error('Error deleting charge:', error);
    res.status(500).json({ message: 'Error deleting charge', error: error.message });
  }
};

