import express from 'express';
import db from '../config/db.js';
import pdf from 'html-pdf';
import ejs from 'ejs';
import path from 'path';
import { generateInvoicePdf } from '../Services/invoiceGenerator.js';
import { sendCheckoutConfirmation } from '../Services/emailService.js';

const router = express.Router();

// Date formatting function
const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Shared invoice generation logic
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

// GET invoice data
router.get('/booking/:id/charges', async (req, res) => {
  try {
    const invoiceData = await generateInvoiceData(req.params.id);
    if (invoiceData.error) return res.status(404).json(invoiceData);
    res.json(invoiceData);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// GET extra charges
router.get('/booking/:id/extra-charges', async (req, res) => {
  try {
    const [charges] = await db.promise().query(
      `SELECT * FROM booking_extra_charges WHERE booking_id = ?`,
      [req.params.id]
    );
    res.json(charges);
  } catch (error) {
    console.error('Error fetching extra charges:', error);
    res.status(500).json({ error: 'Failed to fetch extra charges' });
  }
});

// POST add extra charge
router.post('/booking/:bookingId/extra-charges', async (req, res) => {
  try {
    const { name, description, amount, quantity, chargeType } = req.body;
    
    if (!name || amount === undefined) {
      return res.status(400).json({ error: 'Name and amount are required' });
    }

    const allowedChargeTypes = ['fixed', 'percentage', 'per_day', 'per_person', 'per_km'];
    const finalChargeType = allowedChargeTypes.includes(chargeType) ? chargeType : 'fixed';
    
    const [result] = await db.promise().query(
      `INSERT INTO booking_extra_charges 
       (booking_id, name, description, amount, quantity, charge_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.params.bookingId,
        name,
        description || '',
        parseFloat(amount),
        parseInt(quantity || 1),
        finalChargeType
      ]
    );
    
    const [newCharge] = await db.promise().query(
      `SELECT * FROM booking_extra_charges WHERE id = ?`,
      [result.insertId]
    );
    
    res.status(201).json(newCharge[0]);
  } catch (error) {
    console.error('Error adding extra charge:', error);
    res.status(500).json({ 
      error: 'Failed to add extra charge',
      details: error.message 
    });
  }
});

// PUT update extra charge quantity
router.put('/booking/:bookingId/extra-charges/:chargeId', async (req, res) => {
  try {
    const { quantity } = req.body;
    
    await db.promise().query(
      `UPDATE booking_extra_charges 
       SET quantity = ?
       WHERE id = ? AND booking_id = ?`,
      [quantity, req.params.chargeId, req.params.bookingId]
    );
    
    res.json({ success: true, message: 'Quantity updated successfully' });
  } catch (error) {
    console.error('Error updating extra charge:', error);
    res.status(500).json({ error: 'Failed to update extra charge' });
  }
});

// POST generate invoice
router.post('/booking/:id/invoice', async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    const [existingInvoice] = await db.promise().query(
      `SELECT * FROM invoices WHERE booking_id = ?`,
      [bookingId]
    );

    if (existingInvoice.length > 0) {
      return res.status(400).json({ 
        error: 'Invoice already exists for this booking',
        existing_invoice: existingInvoice[0] 
      });
    }

    const invoiceData = await generateInvoiceData(bookingId);
    if (invoiceData.error) return res.status(404).json(invoiceData);

    const [result] = await db.promise().query(
      `INSERT INTO invoices 
       (booking_id, invoice_number, invoice_date, subtotal, tax_amount, discount_amount, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingId,
        invoiceData.invoice_number,
        invoiceData.invoice_date,
        invoiceData.charges.subtotal,
        invoiceData.charges.tax.amount,
        invoiceData.charges.discount.amount,
        invoiceData.charges.grand_total,
        'generated'
      ]
    );

    await db.promise().query(
      `UPDATE bookings SET invoice_id = ? WHERE id = ?`,
      [result.insertId, bookingId]
    );

    res.json({
      message: 'Invoice generated successfully',
      invoice_id: result.insertId,
      invoice_number: invoiceData.invoice_number,
      ...invoiceData
    });
  } catch (error) {
    console.error('Error saving invoice:', error);
    res.status(500).json({ 
      error: 'Failed to generate and save invoice',
      details: error.message 
    });
  }
});

// POST finalize checkout with comprehensive error handling
router.post('/booking/:id/finalize-checkout', async (req, res) => {
    try {
      const bookingId = req.params.id;
      console.log(`Starting checkout process for booking ID: ${bookingId}`);
      
      // 1. Check if booking exists
      const [bookingCheck] = await db.promise().query(
        `SELECT * FROM bookings WHERE id = ?`,
        [bookingId]
      );
      
      if (!bookingCheck.length) {
        return res.status(404).json({
          error: `Booking with ID ${bookingId} not found`
        });
      }
      
      // 2. Check what status values are allowed in the bookings table
      const [tableInfo] = await db.promise().query(
        `SHOW COLUMNS FROM bookings LIKE 'status'`
      );
      
      // Get the ENUM values if it's an ENUM
      let validStatuses = [];
      if (tableInfo.length > 0 && tableInfo[0].Type.startsWith('enum')) {
        const enumStr = tableInfo[0].Type;
        validStatuses = enumStr
          .substring(5, enumStr.length - 1)  // Remove 'enum(' and the closing ')'
          .split(',')
          .map(s => s.trim().replace(/'/g, '')); // Remove quotes and trim spaces
        
        console.log('Valid booking statuses:', validStatuses);
      }
      
      // Choose the appropriate status value based on what's available
      let checkoutStatus = 'checked-out';
      if (validStatuses.includes('check-out')) {
        checkoutStatus = 'check-out';
      } else if (validStatuses.includes('checkout')) {
        checkoutStatus = 'checkout';
      } else if (validStatuses.includes('completed')) {
        checkoutStatus = 'completed';
      } else if (validStatuses.includes('closed')) {
        checkoutStatus = 'closed';
      }
      
      // 3. Check for existing invoice or create a new one
      let invoiceId = null;
      let invoice = null;
      let invoiceSuccess = false;
      
      try {
        const [existingInvoice] = await db.promise().query(
          `SELECT * FROM invoices WHERE booking_id = ?`,
          [bookingId]
        );
        
        if (existingInvoice.length > 0) {
          console.log(`Found existing invoice #${existingInvoice[0].invoice_number} for booking ${bookingId}`);
          invoiceId = existingInvoice[0].id;
          invoiceSuccess = true;
        } else {
          console.log(`No existing invoice found for booking ${bookingId}, creating new invoice`);
          
          // Generate invoice data
          try {
            invoice = await generateInvoiceData(bookingId);
            
            const [result] = await db.promise().query(
              `INSERT INTO invoices 
               (booking_id, invoice_number, invoice_date, subtotal, tax_amount, discount_amount, total_amount, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                bookingId,
                invoice.invoice_number,
                invoice.invoice_date,
                invoice.charges.subtotal,
                invoice.charges.tax.amount,
                invoice.charges.discount.amount,
                invoice.charges.grand_total,
                'generated'
              ]
            );
            
            invoiceId = result.insertId;
            
            await db.promise().query(
              `UPDATE bookings SET invoice_id = ? WHERE id = ?`,
              [invoiceId, bookingId]
            );
            
            invoiceSuccess = true;
            console.log(`Successfully created invoice #${invoice.invoice_number}`);
          } catch (invoiceError) {
            console.error('Error creating invoice:', invoiceError);
            // Continue with checkout even if invoice creation fails
          }
        }
      } catch (invoiceQueryError) {
        console.error('Error checking for existing invoice:', invoiceQueryError);
        // Continue with checkout even if invoice query fails
      }
      
      // 4. Update booking status
      let statusUpdateSuccess = false;
      try {
        await db.promise().query(
          `UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [checkoutStatus, bookingId]
        );
        statusUpdateSuccess = true;
        console.log(`Successfully updated booking ${bookingId} status to ${checkoutStatus}`);
      } catch (statusError) {
        console.error('Error updating booking status:', statusError);
      }
      
      // 5. Generate PDF and send email if invoice was created
      let pdfSuccess = false;
      let emailSuccess = false;
      let pdfErrorMessage = null;
      let emailErrorMessage = null;
      
      if (invoiceSuccess) {
        try {
          const finalInvoice = invoice || await generateInvoiceData(bookingId);
          const invoicePdf = await generateInvoicePdf(bookingId);
          pdfSuccess = true;
          console.log(`Successfully generated PDF for invoice #${finalInvoice.invoice_number}`);
          
          try {
            const emailResult = await sendCheckoutConfirmation(bookingId, invoicePdf);
            emailSuccess = emailResult;
            console.log(`Email ${emailSuccess ? 'sent successfully' : 'failed to send'}`);
          } catch (emailError) {
            console.error('Error sending email:', emailError);
            emailErrorMessage = emailError.message;
          }
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
          pdfErrorMessage = pdfError.message;
        }
      }
      
      // 6. Determine response status and message based on success of each step
      let responseStatus = 200;
      let responseMessage = '';
      
      if (statusUpdateSuccess && invoiceSuccess && pdfSuccess && emailSuccess) {
        responseMessage = `Checkout completed successfully. Status updated to '${checkoutStatus}'. Invoice has been sent to guest email.`;
      } else if (statusUpdateSuccess) {
        responseStatus = 207; // Multi-Status
        responseMessage = `Checkout status updated to '${checkoutStatus}'`;
        
        if (!invoiceSuccess) {
          responseMessage += ', but invoice creation failed';
        } else if (!pdfSuccess) {
          responseMessage += ', but PDF generation failed';
        } else if (!emailSuccess) {
          responseMessage += ', but email sending failed';
        }
      } else {
        responseStatus = 500;
        responseMessage = 'Failed to update checkout status';
      }
      
      return res.status(responseStatus).json({
        success: statusUpdateSuccess,
        message: responseMessage,
        details: {
          statusUpdated: statusUpdateSuccess,
          invoiceCreated: invoiceSuccess,
          pdfGenerated: pdfSuccess,
          emailSent: emailSuccess,
          pdfError: pdfErrorMessage,
          emailError: emailErrorMessage
        },
        invoice: invoice
      });
      
    } catch (error) {
      console.error('Error finalizing checkout:', error);
      return res.status(500).json({ 
        error: 'Failed to finalize checkout',
        details: error.message 
      });
    }
  });

export default router;