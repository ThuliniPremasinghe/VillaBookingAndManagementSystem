import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import pdf from 'html-pdf';
import { fileURLToPath } from 'url';
import db from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Format currency values
const formatCurrency = (value) => {
  if (typeof value === 'string') value = parseFloat(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value || 0);
};

// Format dates nicely
const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Generate invoice data function - reused from the routes
async function generateInvoiceData(bookingId) {
  try {
    const currentDate = new Date();
    
    // Modified query to handle both room and villa properties
    const [booking] = await db.promise().query(
        `SELECT b.*, 
           CASE 
             WHEN b.propertyType = 'room' THEN r.roomType
             WHEN b.propertyType = 'villa' THEN v.villaLocation 
           END AS accommodationType,
           CASE 
             WHEN b.propertyType = 'room' THEN r.pricePerDay
             WHEN b.propertyType = 'villa' THEN v.pricePerDay
           END AS pricePerDay
         FROM bookings b
         LEFT JOIN rooms r ON b.propertyId = r.id AND b.propertyType = 'room'
         LEFT JOIN villas v ON b.propertyId = v.id AND b.propertyType = 'villa'
         WHERE b.id = ?`, 
        [bookingId]
      );

    if (!booking.length) {
      return { error: `Booking with ID ${bookingId} not found` };
    }

    const invoiceNumber = `INV-${bookingId}-${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}`;

    const [charges] = await db.promise().query(
      `SELECT bc.*, 
       CASE 
         WHEN bc.charge_type = 'meal_plan' THEN mp.name
         WHEN bc.charge_type = 'transportation' THEN CONCAT('Transport - ', t.vehicle_type)
         WHEN bc.charge_type = 'additional_charge' THEN ac.name
       END AS charge_name,
       CASE 
         WHEN bc.charge_type = 'meal_plan' THEN mp.price_per_day
         WHEN bc.charge_type = 'transportation' THEN t.price_per_km
         WHEN bc.charge_type = 'additional_charge' THEN ac.amount
       END AS unit_price,
       CASE 
         WHEN bc.charge_type = 'meal_plan' THEN 'per_day'
         WHEN bc.charge_type = 'transportation' THEN 'per_km'
         WHEN bc.charge_type = 'additional_charge' THEN ac.charge_type
       END AS charge_unit
       FROM booking_charges bc
       LEFT JOIN meal_plans mp ON bc.charge_type = 'meal_plan' AND bc.reference_id = mp.id
       LEFT JOIN transportation_options t ON bc.charge_type = 'transportation' AND bc.reference_id = t.id
       LEFT JOIN additional_charges ac ON bc.charge_type = 'additional_charge' AND bc.reference_id = ac.id
       WHERE bc.booking_id = ?`,
      [bookingId]
    );

    const [extraCharges] = await db.promise().query(
      `SELECT * FROM booking_extra_charges WHERE booking_id = ?`,
      [bookingId]
    );

    const timeDiff = new Date(booking[0].check_out_date) - new Date(booking[0].check_in_date);
    const roomNights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const accommodationTotal = booking[0].pricePerDay * roomNights;

    let chargesTotal = 0;
    const processedCharges = charges.map(charge => {
      let amount = 0;
      
      switch(charge.charge_unit) {
        case 'fixed': amount = charge.unit_price * charge.quantity; break;
        case 'percentage': amount = (accommodationTotal * charge.unit_price / 100) * charge.quantity; break;
        case 'per_day': amount = charge.unit_price * roomNights * charge.quantity; break;
        case 'per_person': amount = charge.unit_price * (booking[0].adults + booking[0].children) * charge.quantity; break;
        case 'per_km': amount = Math.max(charge.unit_price * 10 * charge.quantity, charge.minimum_charge || 0); break;
        default: amount = charge.unit_price * charge.quantity;
      }
      
      chargesTotal += amount;
      
      return {
        id: charge.id,
        name: charge.charge_name,
        type: charge.charge_type,
        quantity: charge.quantity,
        unit_price: charge.unit_price,
        unit_type: charge.charge_unit,
        amount: amount.toFixed(2),
        applied_date: charge.applied_date,
        notes: charge.notes
      };
    });

    let extraChargesTotal = 0;
    const processedExtraCharges = extraCharges.map(charge => {
      let amount = charge.charge_type === 'percentage' 
        ? (accommodationTotal * charge.amount / 100) * charge.quantity
        : charge.amount * charge.quantity;
      
      extraChargesTotal += amount;
      
      return {
        id: charge.id,
        name: charge.name,
        description: charge.description,
        amount: charge.amount,
        quantity: charge.quantity,
        charge_type: charge.charge_type,
        total: amount.toFixed(2)
      };
    });

    const [discounts] = await db.promise().query(
      `SELECT sp.* FROM special_periods sp
       WHERE sp.is_active = TRUE
       AND sp.start_date <= ?
       AND sp.end_date >= ?`,
      [booking[0].check_in_date, booking[0].check_out_date]
    );

    let discountAmount = 0;
    if (discounts.length > 0) {
      const highestDiscount = discounts.reduce((max, discount) => 
        discount.discount_percentage > max.discount_percentage ? discount : max, discounts[0]);
      discountAmount = (accommodationTotal + chargesTotal) * highestDiscount.discount_percentage / 100;
    }

    const subtotal = accommodationTotal + chargesTotal;
    const total = subtotal - discountAmount;
    const taxRate = 0.10;
    const taxAmount = total * taxRate;
    const grandTotal = total + taxAmount + extraChargesTotal;

    // Build the response object with property type information
    return {
      booking_id: bookingId,
      invoice_number: invoiceNumber,
      invoice_date: formatDate(currentDate),
      customer: {
        name: booking[0].guest_name,
        email: booking[0].email,
        phone: booking[0].contact_number
      },
      stay_details: {
        property_type: booking[0].propertyType, // Include property type
        room_type: booking[0].accommodationType, // Using the CASE result
        check_in: formatDate(booking[0].check_in_date),
        check_out: formatDate(booking[0].check_out_date),
        nights: roomNights
      },
      charges: {
        accommodation: {
          type: booking[0].propertyType, // Include property type
          rate_per_night: booking[0].pricePerDay,
          nights: roomNights,
          total: accommodationTotal.toFixed(2)
        },
        additional_charges: processedCharges,
        subtotal: subtotal.toFixed(2),
        discount: {
          amount: discountAmount.toFixed(2),
          description: discounts.length ? discounts[0].name : 'No discount applied'
        },
        tax: {
          rate: `${taxRate * 100}%`,
          amount: taxAmount.toFixed(2)
        },
        grand_total: grandTotal.toFixed(2)
      },
      extra_charges: processedExtraCharges,
      extra_charges_total: extraChargesTotal.toFixed(2),
      payment_status: booking[0].payment_status,
      amount_paid: booking[0].amount_paid || 0,
      balance_due: (grandTotal - (booking[0].amount_paid || 0)).toFixed(2)
    };
  } catch (error) {
    console.error('Error generating invoice data:', error);
    return { error: 'Failed to generate invoice data', details: error.message };
  }
}

// Generate PDF invoice function
export async function generateInvoicePdf(bookingId) {
  try {
    // Generate invoice data
    const invoiceData = await generateInvoiceData(bookingId);
    if (invoiceData.error) {
      console.error('Error in invoice data:', invoiceData.error);
      throw new Error(invoiceData.error);
    }

    // Create data object with helper functions for the template
    const templateData = {
      invoice: invoiceData,
      formatCurrency,
      formatDate,
      calculateExtraChargesTotal: () => {
        return invoiceData.extra_charges.reduce((total, charge) => {
          const amount = parseFloat(charge.amount) || 0;
          const quantity = parseInt(charge.quantity) || 1;
          
          if (charge.charge_type === 'percentage') {
            const invoiceTotal = parseFloat(invoiceData.charges.grand_total) || 0;
            return total + (invoiceTotal * amount / 100) * quantity;
          }
          return total + (amount * quantity);
        }, 0);
      }
    };

    // Path to the EJS template file
    const templatePath = path.join(__dirname, '../templates/invoice.ejs');
    
    // Ensure the template directory exists
    const templateDir = path.join(__dirname, '../templates');
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true });
    }
    
    // If the template doesn't exist, create it
    if (!fs.existsSync(templatePath)) {
      const templateContent = generateEjsTemplate();
      fs.writeFileSync(templatePath, templateContent);
    }

    // Get the template string
    const template = fs.readFileSync(templatePath, 'utf8');
    
    // Render HTML with EJS
    const html = ejs.render(template, templateData);
    
    // Define PDF options
    const options = {
      format: 'A4',
      border: {
        top: '15mm',
        right: '10mm',
        bottom: '15mm',
        left: '10mm'
      },
      footer: {
        height: '10mm',
        contents: {
          default: '<div style="text-align: center; font-size: 10px; color: #777;">Page {{page}} of {{pages}} - Villa Thus</div>'
        }
      }
    };
    
    // Generate PDF as a Promise
    return new Promise((resolve, reject) => {
      pdf.create(html, options).toBuffer((err, buffer) => {
        if (err) {
          console.error('PDF creation error:', err);
          reject(err);
          return;
        }
        resolve(buffer);
      });
    });
  } catch (error) {
    console.error('Error generating PDF invoice:', error);
    throw error;
  }
}