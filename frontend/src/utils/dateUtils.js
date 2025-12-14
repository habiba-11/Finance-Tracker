// Date utility functions for consistent date formatting across the application

/**
 * Format date to DD/MM/YYYY format
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date as DD/MM/YYYY
 */
export const formatDateDDMMYYYY = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Parse DD/MM/YYYY string to Date object
 * @param {string} dateString - Date string in DD/MM/YYYY format
 * @returns {Date} Date object
 */
export const parseDDMMYYYY = (dateString) => {
  if (!dateString) return null;
  
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2], 10);
  
  return new Date(year, month, day);
};

/**
 * Convert YYYY-MM-DD (from HTML date input) to DD/MM/YYYY for display
 * @param {string} yyyyMmDd - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date as DD/MM/YYYY
 */
export const formatDateInputToDisplay = (yyyyMmDd) => {
  if (!yyyyMmDd) return '';
  
  const parts = yyyyMmDd.split('-');
  if (parts.length !== 3) return yyyyMmDd;
  
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  
  return `${day}/${month}/${year}`;
};

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD (for HTML date input)
 * @param {string} ddMmYyyy - Date string in DD/MM/YYYY format
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatDisplayToDateInput = (ddMmYyyy) => {
  if (!ddMmYyyy) return '';
  
  const parts = ddMmYyyy.split('/');
  if (parts.length !== 3) return ddMmYyyy;
  
  const day = parts[0];
  const month = parts[1];
  const year = parts[2];
  
  return `${year}-${month}-${day}`;
};



