// models/chargesModel.js
import db from '../config/db.js';
import { promisify } from 'util';

// Convert db.query to Promise
const query = promisify(db.query).bind(db);

// Get all additional charges by category (fees, taxes, services)
export const getChargesByCategory = async (category) => {
  const sql = `
    SELECT *
    FROM additional_charges
    WHERE charge_category = ?
    AND is_active = TRUE
    ORDER BY name
  `;
  return await query(sql, [category]);
};

// Create a new additional charge
export const createAdditionalCharge = async (data) => {
  const {
    name, 
    description, 
    charge_category, 
    charge_type, 
    amount, 
    applies_to_age_group, 
    max_days_apply, 
    applies_to_property_type,
    is_active = true
  } = data;

  const sql = `
    INSERT INTO additional_charges
    (name, description, charge_category, charge_type, amount, 
    applies_to_age_group, max_days_apply, applies_to_property_type, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await query(sql, [
    name, 
    description, 
    charge_category, 
    charge_type, 
    amount, 
    applies_to_age_group, 
    max_days_apply, 
    applies_to_property_type,
    is_active
  ]);

  return result;
};

// Update an additional charge
export const updateAdditionalCharge = async (id, data) => {
  const {
    name, 
    description, 
    charge_type, 
    amount, 
    applies_to_age_group, 
    max_days_apply, 
    applies_to_property_type,
    is_active = true
  } = data;

  const sql = `
    UPDATE additional_charges
    SET name = ?, description = ?, charge_type = ?, amount = ?,
    applies_to_age_group = ?, max_days_apply = ?, applies_to_property_type = ?,
    is_active = ?
    WHERE id = ?
  `;

  const result = await query(sql, [
    name, 
    description, 
    charge_type, 
    amount, 
    applies_to_age_group, 
    max_days_apply, 
    applies_to_property_type,
    is_active, 
    id
  ]);

  return result;
};

// Delete an additional charge
export const deleteAdditionalCharge = async (id) => {
  const sql = "UPDATE additional_charges SET is_active = FALSE WHERE id = ?";
  const result = await query(sql, [id]);
  return result;
};

// Get all meal plans
export const getMealPlans = async () => {
  const sql = `
    SELECT *
    FROM meal_plans
    WHERE is_active = TRUE
    ORDER BY name
  `;
  return await query(sql);
};

// Create a new meal plan
export const createMealPlan = async (data) => {
  const {
    name, 
    description, 
    breakfast_included, 
    lunch_included, 
    dinner_included, 
    price_per_day,
    is_active = true
  } = data;

  const sql = `
    INSERT INTO meal_plans
    (name, description, breakfast_included, lunch_included, dinner_included, price_per_day, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await query(sql, [
    name, 
    description, 
    breakfast_included, 
    lunch_included, 
    dinner_included, 
    price_per_day,
    is_active
  ]);

  return result;
};

// Update a meal plan
export const updateMealPlan = async (id, data) => {
  const {
    name, 
    description, 
    breakfast_included, 
    lunch_included, 
    dinner_included, 
    price_per_day,
    is_active = true
  } = data;

  const sql = `
    UPDATE meal_plans
    SET name = ?, description = ?, breakfast_included = ?, lunch_included = ?,
    dinner_included = ?, price_per_day = ?, is_active = ?
    WHERE id = ?
  `;

  const result = await query(sql, [
    name, 
    description, 
    breakfast_included, 
    lunch_included, 
    dinner_included, 
    price_per_day,
    is_active, 
    id
  ]);

  return result;
};

// Delete a meal plan
export const deleteMealPlan = async (id) => {
  const sql = "UPDATE meal_plans SET is_active = FALSE WHERE id = ?";
  const result = await query(sql, [id]);
  return result;
};

// Get all transportation options
export const getTransportation = async () => {
  const sql = `
    SELECT *
    FROM transportation_options
    WHERE is_active = TRUE
    ORDER BY vehicle_type
  `;
  return await query(sql);
};

// Create a new transportation option
export const createTransportation = async (data) => {
  const {
    name,
    description,
    vehicle_type, 
    capacity, 
    price_per_km, 
    minimum_charge,
    is_active = true
  } = data;

  const sql = `
    INSERT INTO transportation_options
    (vehicle_type, capacity, price_per_km, minimum_charge, is_active)
    VALUES (?, ?, ?, ?, ?)
  `;

  const result = await query(sql, [
    vehicle_type, 
    capacity, 
    price_per_km, 
    minimum_charge,
    is_active
  ]);

  return result;
};

// Update a transportation option
export const updateTransportation = async (id, data) => {
  const {
    vehicle_type, 
    capacity, 
    price_per_km, 
    minimum_charge,
    is_active = true
  } = data;

  const sql = `
    UPDATE transportation_options
    SET vehicle_type = ?, capacity = ?, price_per_km = ?, minimum_charge = ?, is_active = ?
    WHERE id = ?
  `;

  const result = await query(sql, [
    vehicle_type, 
    capacity, 
    price_per_km, 
    minimum_charge,
    is_active, 
    id
  ]);

  return result;
};

// Delete a transportation option
export const deleteTransportation = async (id) => {
  const sql = "UPDATE transportation_options SET is_active = FALSE WHERE id = ?";
  const result = await query(sql, [id]);
  return result;
};

// Get all special periods
export const getSpecialPeriods = async () => {
  const sql = `
    SELECT *
    FROM special_periods
    WHERE is_active = TRUE
    ORDER BY start_date
  `;
  return await query(sql);
};

// Create a new special period
export const createSpecialPeriod = async (data) => {
  const {
    name, 
    description, 
    start_date, 
    end_date, 
    discount_percentage,
    is_active = true
  } = data;

  const sql = `
    INSERT INTO special_periods
    (name, description, start_date, end_date, discount_percentage, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const result = await query(sql, [
    name, 
    description, 
    start_date, 
    end_date, 
    discount_percentage,
    is_active
  ]);

  return result;
};

// Update a special period
export const updateSpecialPeriod = async (id, data) => {
  const {
    name, 
    description, 
    start_date, 
    end_date, 
    discount_percentage,
    is_active = true
  } = data;

  const sql = `
    UPDATE special_periods
    SET name = ?, description = ?, start_date = ?, end_date = ?,
    discount_percentage = ?, is_active = ?
    WHERE id = ?
  `;

  const result = await query(sql, [
    name, 
    description, 
    start_date, 
    end_date, 
    discount_percentage,
    is_active, 
    id
  ]);

  return result;
};

// Delete a special period
export const deleteSpecialPeriod = async (id) => {
  const sql = "UPDATE special_periods SET is_active = FALSE WHERE id = ?";
  const result = await query(sql, [id]);
  return result;
};