import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ChargesManagement.css';
import ManagerSidebar from "./ManagerSidebar";

const ChargesManagement = () => {
  const [charges, setCharges] = useState({
    fees: [],
    taxes: [],
    services: [],
    mealPlans: [],
    transportation: [],
    specialPeriods: []
  });
  const [activeTab, setActiveTab] = useState('fees');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData());
  const [editingId, setEditingId] = useState(null);

  const API_BASE_URL = 'http://localhost:3037'; // Your backend port


  useEffect(() => {
    fetchCharges();
  }, []);

  function getInitialFormData() {
    return {
      name: '',
      description: '',
      charge_category: 'fee',
      charge_type: 'fixed',
      amount: '',
      applies_to_age_group: 'all',
      max_days_apply: '',
      applies_to_property_type: 'all',
      breakfast_included: false,
      lunch_included: false,
      dinner_included: false,
      price_per_day: '',
      vehicle_type: '',
      capacity: '',
      price_per_km: '',
      minimum_charge: '',
      start_date: '',
      end_date: '',
      discount_percentage: ''
    };
  }

  const fetchCharges = async () => {
    try {
      console.log("Fetching charges from:", `${API_BASE_URL}/api/charges`);
      const response = await axios.get(`${API_BASE_URL}/api/charges`);
      console.log("Received data:", response.data);
      setCharges(response.data);
    } catch (error) {
      console.error('Full error:', {
        message: error.message,
        config: error.config,
        response: error.response?.data,
        stack: error.stack
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    try {
      const payload = { category: activeTab, data: prepareFormData() };
      const url = editingId 
        ? `${API_BASE_URL}/api/charges/${editingId}`
        : `${API_BASE_URL}/api/charges`;
      
      const method = editingId ? 'put' : 'post';
      await axios[method](url, payload);
    
      fetchCharges();
      resetForm();
    } catch (error) {
      console.error('Error saving charge:', error);
    }
  };

  function prepareFormData() {
    const baseFields = {
      name: formData.name,
      description: formData.description,
      is_active: true
    };

    switch(activeTab) {
      case 'fees':
      case 'taxes':
      case 'services':
        // Fix the charge_category mapping here
      const categoryMap = {
        'fees': 'fee',
        'taxes': 'tax',
        'services': 'service'
      };
      
        return {
          ...baseFields,
          charge_category: categoryMap[activeTab],
          charge_type: formData.charge_type,
          amount: parseFloat(formData.amount),
          applies_to_age_group: formData.applies_to_age_group,
          max_days_apply: formData.max_days_apply ? parseInt(formData.max_days_apply) : null,
          applies_to_property_type: formData.applies_to_property_type
        };
      case 'mealPlans':
        return {
          ...baseFields,
          breakfast_included: formData.breakfast_included,
          lunch_included: formData.lunch_included,
          dinner_included: formData.dinner_included,
          price_per_day: parseFloat(formData.price_per_day)
        };
      case 'transportation':
        return {
          ...baseFields,
          vehicle_type: formData.vehicle_type,
          capacity: parseInt(formData.capacity),
          price_per_km: parseFloat(formData.price_per_km),
          minimum_charge: parseFloat(formData.minimum_charge)
        };
      case 'specialPeriods':
        return {
          ...baseFields,
          start_date: formData.start_date,
          end_date: formData.end_date,
          discount_percentage: parseFloat(formData.discount_percentage)
        };
      default:
        return baseFields;
    }
  }

  const handleEdit = (item) => {
    setFormData({
      ...getInitialFormData(),
      ...item
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`/api/charges/${id}?category=${activeTab}`);
        fetchCharges();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
    setEditingId(null);
    setShowForm(false);
  };

  const formatAmount = (value) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return num.toFixed(2);
  };
  

  const renderForm = () => {
    
    if (!showForm) return null;

    

    return (
      <div className="charge-form-container">
       
       
        <h3>{editingId ? 'Edit' : 'Add New'} {activeTab.replace(/s$/, '').replace(/([A-Z])/g, ' $1').trim()}</h3>
        <form onSubmit={handleSubmit}>
          {/* Common fields */}
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          {/* Category-specific fields */}
          {['fees', 'taxes', 'services'].includes(activeTab) && (
            <>
              <div className="form-group">
                <label>Charge Type</label>
                <select
                  name="charge_type"
                  value={formData.charge_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="percentage">Percentage</option>
                  <option value="per_day">Per Day</option>
                  <option value="per_person">Per Person</option>
                  <option value="per_item">Per Item</option>
                </select>
              </div>

              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Applies to Age Group</label>
                <select
                  name="applies_to_age_group"
                  value={formData.applies_to_age_group}
                  onChange={handleInputChange}
                >
                  <option value="all">All Guests</option>
                  <option value="adults">Adults Only</option>
                  <option value="children">Children Only</option>
                </select>
              </div>

              <div className="form-group">
                <label>Maximum Days to Apply (leave blank for no limit)</label>
                <input
                  type="number"
                  name="max_days_apply"
                  value={formData.max_days_apply}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Applies to Property Type</label>
                <select
                  name="applies_to_property_type"
                  value={formData.applies_to_property_type}
                  onChange={handleInputChange}
                >
                  <option value="all">All Properties</option>
                  <option value="room">Rooms Only</option>
                  <option value="villa">Villas Only</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'mealPlans' && (
            <>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="breakfast_included"
                    checked={formData.breakfast_included}
                    onChange={handleInputChange}
                  />
                  Includes Breakfast
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="lunch_included"
                    checked={formData.lunch_included}
                    onChange={handleInputChange}
                  />
                  Includes Lunch
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="dinner_included"
                    checked={formData.dinner_included}
                    onChange={handleInputChange}
                  />
                  Includes Dinner
                </label>
              </div>

              <div className="form-group">
                <label>Price Per Day</label>
                <input
                  type="number"
                  name="price_per_day"
                  value={formData.price_per_day}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </>
          )}

          {activeTab === 'transportation' && (
            <>
              <div className="form-group">
                <label>Vehicle Type</label>
                <input
                  type="text"
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Price Per Kilometer</label>
                <input
                  type="number"
                  name="price_per_km"
                  value={formData.price_per_km}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Minimum Charge</label>
                <input
                  type="number"
                  name="minimum_charge"
                  value={formData.minimum_charge}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </>
          )}

          {activeTab === 'specialPeriods' && (
            <>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Discount Percentage</label>
                <input
                  type="number"
                  name="discount_percentage"
                  value={formData.discount_percentage}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="100"
                  required
                />
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update' : 'Save'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderTable = (items) => {
    if (!items || items.length === 0) {
      return <p>No items found</p>;
    }
  
    const columns = getColumnsForTab();
    
    return (
      <table className="charges-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th className="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(item) : item[col.key]}
                </td>
              ))}
              <td className="actions-cell">
                <div className="action-buttons">
                  <button className="btn btn-edit" onClick={() => handleEdit(item)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  function getColumnsForTab() {
    switch(activeTab) {
      case 'fees':
      case 'taxes':
      case 'services':
        return [
          { key: 'name', label: 'Label' },
          { 
            key: 'charge_type', 
            label: 'Type',
            render: (item) => {
              const typeMap = {
                'fixed': 'Fixed amount',
                'percentage': 'Percentage',
                'per_day': 'Per day',
                'per_person': 'Per person',
                'per_item': 'Per item'
              };
              return typeMap[item.charge_type] || item.charge_type;
            }
          },
          { 
            key: 'amount', 
            label: 'Amount',
            render: (item) => {
              if (item.charge_type === 'percentage') {
                return `${item.amount || 0}%`;
              }
              return `$${formatAmount(item.amount)}`;
            }
          },
          { 
            key: 'max_days_apply', 
            label: 'Limit',
            render: (item) => item.max_days_apply ? `${item.max_days_apply} days` : '-'
          },
          { 
            key: 'applies_to_property_type', 
            label: 'Accommodations',
            render: (item) => {
              const map = {
                'all': 'All',
                'room': 'Rooms',
                'villa': 'Villas'
              };
              return map[item.applies_to_property_type];
            }
          }
        ];
      case 'mealPlans':
        return [
          { key: 'name', label: 'Meal Plan' },
          { 
            key: 'breakfast_included', 
            label: 'Includes',
            render: (item) => {
              const includes = [];
              if (item.breakfast_included) includes.push('Breakfast');
              if (item.lunch_included) includes.push('Lunch');
              if (item.dinner_included) includes.push('Dinner');
              return includes.join(', ') || 'None';
            }
          },
          { 
            key: 'price_per_day', 
            label: 'Price Per Day',
            render: (item) => `$${formatAmount(item.price_per_day)}`
          }
        ];
      case 'transportation':
        return [
          { key: 'vehicle_type', label: 'Vehicle Type' },
          { key: 'capacity', label: 'Capacity' },
          { 
            key: 'price_per_km', 
            label: 'Price Per KM',
            render: (item) => `$${formatAmount(item.price_per_km)}`
          },
          { 
            key: 'minimum_charge', 
            label: 'Minimum Charge',
            render: (item) => `$${formatAmount(item.minimum_charge)}`
          }
        ];
      case 'specialPeriods':
        return [
          { key: 'name', label: 'Period Name' },
          { 
            key: 'start_date', 
            label: 'Date Range',
            render: (item) => `${new Date(item.start_date).toLocaleDateString()} - ${new Date(item.end_date).toLocaleDateString()}`
          },
          { 
            key: 'discount_percentage', 
            label: 'Discount',
            render: (item) => `${item.discount_percentage}%`
          }
        ];
      default:
        return [];
    }
  }

  return (
    <div className="charges-management">
       <ManagerSidebar />
      <h1>Additional Charges</h1>
      
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'fees' ? 'active' : ''}`}
          onClick={() => setActiveTab('fees')}
        >
          Fees
        </button>
        <button 
          className={`tab-btn ${activeTab === 'taxes' ? 'active' : ''}`}
          onClick={() => setActiveTab('taxes')}
        >
          Taxes
        </button>
        <button 
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          Services
        </button>
        <button 
          className={`tab-btn ${activeTab === 'mealPlans' ? 'active' : ''}`}
          onClick={() => setActiveTab('mealPlans')}
        >
          Meal Plans
        </button>
        <button 
          className={`tab-btn ${activeTab === 'transportation' ? 'active' : ''}`}
          onClick={() => setActiveTab('transportation')}
        >
          Transportation
        </button>
        <button 
          className={`tab-btn ${activeTab === 'specialPeriods' ? 'active' : ''}`}
          onClick={() => setActiveTab('specialPeriods')}
        >
          Special Periods
        </button>
      </div>

      <div className="tab-content">
        <div className="section-header">
          
          <button 
            className="btn btn-primary"
            onClick={() => {
              setFormData(getInitialFormData());
              setEditingId(null);
              setShowForm(true);
            }}
          >
            Add New
          </button>
        </div>

        {renderForm()}
        {renderTable(charges[activeTab])}
      </div>
    </div>
  );
};

export default ChargesManagement;