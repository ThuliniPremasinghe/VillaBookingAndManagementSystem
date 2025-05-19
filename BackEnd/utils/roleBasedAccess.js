// utils/roleBasedAccess.js

/**
 * Filters data based on user role and assigned property
 * @param {Object} user - The authenticated user object
 * @param {Array} data - The data to be filtered
 * @returns {Array} - Filtered data based on user's access level
 */
export const filterDataByRole = (user, data) => {
    if (!user || !data) return [];
    
    // Admin sees all data
    if (user.role === 'admin') {
      return data;
    }
  
    // Managers and front desk staff only see their assigned property data
    if (['manager', 'front_desk'].includes(user.role)) {
      if (!user.villaId) {
        console.error(`No villa assigned to ${user.role} ${user.id}`);
        return [];
      }
      return data.filter(item => 
        item.propertyType === 'villa' && 
        item.propertyId === user.villaId
      );
    }
  
    // Customers see their own bookings
    if (user.role === 'customer') {
      return data.filter(item => item.userId === user.id);
    }
  
    // Default return empty array for unknown roles
    return [];
  };
  
  /**
   * Checks if user has permission to access a specific property
   * @param {Object} user - The authenticated user object
   * @param {number} propertyId - The property ID to check
   * @returns {boolean} - Whether the user has access
   */
  export const hasPropertyAccess = (user, propertyId) => {
    if (!user) return false;
    
    if (user.role === 'admin') return true;
    
    if (['manager', 'front_desk'].includes(user.role)) {
      return user.villaId === propertyId;
    }
    
    return false;
  };