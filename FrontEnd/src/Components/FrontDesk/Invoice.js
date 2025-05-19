import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './Invoice.css';
import { FaPrint, FaPlus } from 'react-icons/fa';
import FrontDeskSidebar from "./FrontDeskSidebar";

const Invoice = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [extraCharges, setExtraCharges] = useState([]);
  const [showSelectChargeModal, setShowSelectChargeModal] = useState(false);
  const [predefinedCharges, setPredefinedCharges] = useState([]);
  const [isCheckout, setIsCheckout] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [editingChargeId, setEditingChargeId] = useState(null);
  const [tempQuantity, setTempQuantity] = useState(1);
 
  // Check if this is a checkout flow
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsCheckout(params.get('checkout') === 'true');
  }, []);

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

  // Fetch all invoice data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [invoiceRes, chargesRes, predefinedRes] = await Promise.all([
          axios.get(`http://localhost:3037/api/invoice/booking/${bookingId}/charges`),
          axios.get(`http://localhost:3037/api/invoice/booking/${bookingId}/extra-charges`),
          axios.get(`http://localhost:3037/api/charges`)
        ]);
        
        setInvoice(invoiceRes.data);
        setExtraCharges(chargesRes.data);
        
        // Combine all predefined charge types from database
        setPredefinedCharges([
          ...(predefinedRes.data.fees || []),
          ...(predefinedRes.data.taxes || []),
          ...(predefinedRes.data.services || []),
          ...(predefinedRes.data.mealPlans || []),
          ...(predefinedRes.data.transportation || [])
        ]);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load invoice data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);

  // Quantity editing handlers
  const handleEditQuantity = (charge) => {
    setEditingChargeId(charge.id);
    setTempQuantity(charge.quantity);
  };
  
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    setTempQuantity(isNaN(value) ? 1 : Math.max(1, value));
  };
  
  const handleUpdateQuantity = async (chargeId) => {
    try {
      await axios.put(
        `http://localhost:3037/api/invoice/booking/${bookingId}/extra-charges/${chargeId}`,
        { quantity: tempQuantity }
      );
      
      // Refresh both invoice and charges data
      const [invoiceRes, chargesRes] = await Promise.all([
        axios.get(`http://localhost:3037/api/invoice/booking/${bookingId}/charges`),
        axios.get(`http://localhost:3037/api/invoice/booking/${bookingId}/extra-charges`)
      ]);
      
      setInvoice(invoiceRes.data);
      setExtraCharges(chargesRes.data);
      setEditingChargeId(null);
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert(error.response?.data?.error || 'Failed to update quantity. Please try again.');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingChargeId(null);
  };
  
  const handleIncrementQuantity = () => {
    setTempQuantity(prev => prev + 1);
  };
  
  const handleDecrementQuantity = () => {
    setTempQuantity(prev => Math.max(1, prev - 1));
  };

  // Generate invoice handler

  // Add predefined charge handler
  const handleAddPredefinedCharge = async (charge) => {
    try {
      const validChargeTypes = ['fixed', 'percentage', 'per_day', 'per_person', 'per_km'];
      const chargeType = validChargeTypes.includes(charge.charge_type) 
        ? charge.charge_type 
        : 'fixed';
  
      await axios.post(
        `http://localhost:3037/api/invoice/booking/${bookingId}/extra-charges`,
        {
          name: charge.name,
          description: charge.description || '',
          amount: charge.amount || charge.price_per_day || charge.price_per_km || 0,
          quantity: 1,
          chargeType
        }
      );
      
      // Refresh data after adding charge
      const [invoiceRes, chargesRes] = await Promise.all([
        axios.get(`http://localhost:3037/api/invoice/booking/${bookingId}/charges`),
        axios.get(`http://localhost:3037/api/invoice/booking/${bookingId}/extra-charges`)
      ]);
      
      setInvoice(invoiceRes.data);
      setExtraCharges(chargesRes.data);
      setShowSelectChargeModal(false);
    } catch (error) {
      console.error('Error adding charge:', error);
      alert(error.response?.data?.error || 'Failed to add charge. Please try again.');
    }
  };

  // Finalize checkout handler
  const handleFinalizeCheckout = async () => {
    try {
      setProcessingCheckout(true);
      
      // First ensure an invoice exists
      if (!invoice) {
        const { data } = await axios.post(
          `http://localhost:3037/api/invoice/booking/${bookingId}/invoice`
        );
        setInvoice(data);
      }
      
      // Then finalize checkout
      const { data } = await axios.post(
        `http://localhost:3037/api/invoice/booking/${bookingId}/finalize-checkout`
      );
      
      alert(data.message || 'Checkout completed successfully');
      navigate('/frontdeskcheckout');
    } catch (error) {
      console.error('Error during checkout:', error);
      alert(error.response?.data?.error || 'Checkout failed. Please try again.');
    } finally {
      setProcessingCheckout(false);
    }
  };

  // Calculate total of extra charges
  const calculateExtraChargesTotal = () => {
    return extraCharges.reduce((total, charge) => {
      const amount = parseFloat(charge.amount) || 0;
      const quantity = parseInt(charge.quantity) || 1;
      
      if (charge.charge_type === 'percentage') {
        const invoiceTotal = parseFloat(invoice?.charges?.grand_total) || 0;
        return total + (invoiceTotal * amount / 100) * quantity;
      }
      return total + (amount * quantity);
    }, 0);
  };

  // Loading and error states
  if (loading) return <div className="invoice-loading">Loading invoice...</div>;
  if (error) return <div className="invoice-error">{error}</div>;
  if (!invoice) return <div className="invoice-not-found">Invoice data not available</div>;

  // Calculate totals
  const extraChargesTotal = calculateExtraChargesTotal();
  const grandTotal = (parseFloat(invoice.charges.grand_total) + extraChargesTotal).toFixed(2);

  // Get property type information
  const propertyType = invoice.stay_details.property_type || 'room';
  const accommodationType = invoice.stay_details.room_type;
  
  // Format the accommodation type display
  const accommodationTypeDisplay = propertyType === 'villa' ? 'Villa' : 'Room';

  return (
    <div className="invoice-container">
      <FrontDeskSidebar />
      
      {/* Add Charge Modal */}
      {showSelectChargeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Extra Charges</h3>
            <div className="predefined-charges-list">
              {predefinedCharges.length > 0 ? (
                <table className="charges-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predefinedCharges.map((charge, index) => (
                      <tr key={index}>
                        <td>{charge.name}</td>
                        <td>{charge.description || '-'}</td>
                        <td>
                          {charge.charge_type === 'percentage' 
                            ? `${charge.amount}%` 
                            : formatCurrency(charge.amount || charge.price_per_day || charge.price_per_km)}
                        </td>
                        <td>
                          {charge.charge_category || 
                           (charge.breakfast_included ? 'Meal Plan' : 
                            charge.vehicle_type ? 'Transportation' : 'Service')}
                        </td>
                        <td>
                          <button 
                            className="btn-select"
                            onClick={() => handleAddPredefinedCharge(charge)}
                          >
                            Add 
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No predefined charges available</p>
              )}
            </div>
            <div className="modal-actions">
              <button 
                className="btn-secondary" 
                onClick={() => setShowSelectChargeModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="invoice-actions">
        <div className="action-buttons">
          {isCheckout && (
            <button 
              className="btn-add-charge"
              onClick={() => setShowSelectChargeModal(true)}
            >
              <FaPlus /> Add Extra Charge
            </button>
          )}
          <button className="btn-print" onClick={() => window.print()}>
            <FaPrint /> Print 
          </button>
         
        </div>
      </div>

      {/* Invoice Content */}
      <div className="invoice-paper">
        <header className="invoice-header">
          <div className="hotel-info">
            <h1>Villa Thus</h1>
            <p>459/2/1, Abimangama Road,<br />
              Gintota, Galle,<br />
              Sri Lanka</p>
            <p>+94 77 232 8333 </p>
            <p>info@villathus.com</p>
          </div>
          <div className="invoice-info">
            <h2>INVOICE</h2>
            <p>Invoice #: {invoice.invoice_number}</p>
            <p>Date: {formatDate(invoice.invoice_date)}</p>
          </div>
        </header>

        {/* Customer Information */}
        <div className="invoice-customer">
          <h3>Bill To:</h3>
          <p><strong>Name:</strong> {invoice.customer.name}</p>
          <p><strong>E-mail:</strong> {invoice.customer.email}</p>
          <p><strong>Contact Number:</strong> {invoice.customer.phone}</p>
        </div>

        {/* Stay Details */}
        <div className="invoice-stay-details">
          <h3>Booking Details:</h3>
          <div className="stay-details-grid">
            <div><strong>{accommodationTypeDisplay} Type:</strong> {accommodationType}</div>
            <div><strong>Check-In:</strong> {formatDate(invoice.stay_details.check_in)}</div>
            <div><strong>Check-Out:</strong> {formatDate(invoice.stay_details.check_out)}</div>
            <div><strong>Nights:</strong> {invoice.stay_details.nights}</div>
          </div>
        </div>

        {/* Main Charges */}
        <div className="invoice-charges">
          <h3>Charges</h3>
          <table className="charges-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {accommodationType} {accommodationTypeDisplay} Accommodation
                  <div className="charge-detail">
                    {invoice.stay_details.nights} night(s)
                  </div>
                </td>
                <td>{invoice.stay_details.nights}</td>
                <td>{formatCurrency(invoice.charges.accommodation.rate_per_night)}</td>
                <td>{formatCurrency(invoice.charges.accommodation.total)}</td>
              </tr>

              {invoice.charges.additional_charges.map((charge, index) => (
                <tr key={index}>
                  <td>
                    {charge.name}
                    {charge.notes && <div className="charge-detail">{charge.notes}</div>}
                  </td>
                  <td>{charge.quantity} {charge.unit_type === 'per_day' ? 'day(s)' : ''}</td>
                  <td>
                    {charge.unit_type === 'percentage'
                      ? `${charge.unit_price}%`
                      : formatCurrency(charge.unit_price)}
                  </td>
                  <td>{formatCurrency(charge.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Extra Charges */}
        {extraCharges.length > 0 && (
          <div className="invoice-extra-charges">
            <h3>Extra Charges</h3>
            <table className="charges-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {extraCharges.map((charge, index) => (
                  <tr key={index}>
                    <td>
                      {charge.name}
                      {charge.description && <div className="charge-detail">{charge.description}</div>}
                    </td>
                    <td>
                      {editingChargeId === charge.id ? (
                        <div className="quantity-controls">
                          <button 
                            className="quantity-btn" 
                            onClick={handleDecrementQuantity}
                            disabled={tempQuantity <= 1}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={tempQuantity}
                            onChange={handleQuantityChange}
                            className="quantity-input"
                          />
                          <button 
                            className="quantity-btn" 
                            onClick={handleIncrementQuantity}
                          >
                            +
                          </button>
                          <div className="quantity-actions">
                            <button 
                              className="btn-save"
                              onClick={() => handleUpdateQuantity(charge.id)}
                            >
                              Save
                            </button>
                            <button 
                              className="btn-cancel"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="quantity-display">
                          {charge.quantity}
                          {isCheckout && (
                            <button 
                              className="btn-edit"
                              onClick={() => handleEditQuantity(charge)}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {charge.charge_type === 'percentage'
                        ? `${charge.amount}%`
                        : formatCurrency(charge.amount)}
                    </td>
                    <td>
                      {charge.charge_type === 'percentage'
                        ? formatCurrency((parseFloat(invoice.charges.grand_total) * charge.amount / 100) * charge.quantity)
                        : formatCurrency(charge.amount * charge.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals Section */}
        <div className="invoice-totals">
          <div className="totals-grid">
            <div>Subtotal:</div>
            <div>{formatCurrency(invoice.charges.subtotal)}</div>

            <div>Discount:</div>
            <div className="text-discount">
              {formatCurrency(invoice.charges.discount.amount)}
              <div className="discount-description">
                {invoice.charges.discount.description}
              </div>
            </div>

            <div>Tax ({invoice.charges.tax.rate}):</div>
            <div>{formatCurrency(invoice.charges.tax.amount)}</div>

            {extraCharges.length > 0 && (
              <>
                <div>Extra Charges:</div>
                <div>{formatCurrency(extraChargesTotal)}</div>
              </>
            )}

            <div className="grand-total-label">Grand Total:</div>
            <div className="grand-total-amount">
              {formatCurrency(grandTotal)}
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="invoice-payment">
          <div className="payment-grid">
            <div>Amount Paid:</div>
            <div>{formatCurrency(invoice.amount_paid)}</div>

            <div>Balance Due:</div>
            <div className={parseFloat(grandTotal) - parseFloat(invoice.amount_paid) > 0 ? 'balance-due' : 'balance-paid'}>
              {formatCurrency(parseFloat(grandTotal) - parseFloat(invoice.amount_paid || 0))}
            </div>
          </div>
        </div>

        {/* Checkout Button (only in checkout flow) */}
        {isCheckout && (
          <div className="checkout-actions">
            <button 
              className="btn-checkout"
              onClick={handleFinalizeCheckout}
              disabled={processingCheckout}
            >
              {processingCheckout ? 'Processing...' : 'Complete Checkout'}
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="invoice-footer">
          <p>Thank you for staying with us!</p>
          <p>Payment terms: Due upon receipt. Please make checks payable to Villa Thus.</p>
          <p className="footer-note">
            If you have any questions about this invoice, please contact our front desk.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Invoice;