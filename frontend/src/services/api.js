// API Service Layer - Adapter/Factory Pattern
// Centralizes all API calls and provides a consistent interface

const API_BASE_URL = 'http://localhost:3000';

// Generic API request handler with comprehensive logging
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...(options.body && { body: options.body }),
  };

  console.log('🔵 API REQUEST:', config.method, url);
  if (options.body) {
    console.log('Request body:', options.body);
  }

  try {
    const response = await fetch(url, config);
    
    console.log('🟢 API RESPONSE:', response.status, response.statusText);
    
    let data;
    
    // Try to parse JSON
    try {
      const text = await response.text();
      console.log('Response text (first 500 chars):', text.substring(0, 500));
      data = text ? JSON.parse(text) : null;
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      const text = await response.text();
      throw new Error(`Failed to parse JSON response: ${text.substring(0, 200)}`);
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
      console.error('❌ API Error Response:', {
        status: response.status,
        message: errorMessage,
        data: data
      });
      throw new Error(errorMessage);
    }

    console.log('✅ API Success - Data received:', data);
    return data;
  } catch (error) {
    console.error('❌ API REQUEST FAILED:', {
      url: url,
      method: config.method,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// API Factory - Creates API methods for different resources
export const apiFactory = {
  // User/Auth APIs
  users: {
    register: (userData) => 
      apiRequest('/users/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    
    login: (credentials) =>
      apiRequest('/users/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
  },

  // Budget APIs
  budgets: {
    create: (budgetData) =>
      apiRequest('/budgets', {
        method: 'POST',
        body: JSON.stringify(budgetData),
      }),
    
    getBudget: (userId, month, year) =>
      apiRequest(`/budgets/${userId}/${month}/${year}`),
    
    getAllBudgets: (userId) =>
      apiRequest(`/budgets/all/${userId}`),
  },

  // Transaction APIs
  transactions: {
    create: (transactionData) =>
      apiRequest('/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      }),
    
    getUserTransactions: (userId) =>
      apiRequest(`/transactions/${userId}`),
  },
};

export default apiFactory;
