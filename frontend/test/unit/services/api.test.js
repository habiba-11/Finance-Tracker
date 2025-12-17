// API Service Unit Tests
// Testing the API factory pattern implementation

import { apiFactory } from '../../../src/services/api.js';

// Mock global fetch
global.fetch = jest.fn();

describe('API Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    fetch.mockClear();
  });

  describe('apiFactory.users.register', () => {
    it('should make POST request to /users/register with correct data', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
      });

      // Act
      const result = await apiFactory.users.register(userData);

      // Assert
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/users/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle registration error response', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const errorResponse = {
        message: 'Email already exists',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => errorResponse,
        text: async () => JSON.stringify(errorResponse),
      });

      // Act & Assert
      await expect(apiFactory.users.register(userData)).rejects.toThrow(
        'Email already exists'
      );
    });
  });

  describe('apiFactory.users.login', () => {
    it('should make POST request to /users/login with correct credentials', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        userId: '507f1f77bcf86cd799439011',
        token: 'mock-token',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
      });

      // Act
      const result = await apiFactory.users.login(credentials);

      // Assert
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/users/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle login error response', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const errorResponse = {
        message: 'Invalid credentials',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => errorResponse,
        text: async () => JSON.stringify(errorResponse),
      });

      // Act & Assert
      await expect(apiFactory.users.login(credentials)).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('apiFactory.budgets.create', () => {
    it('should make POST request to /budgets with correct data', async () => {
      // Arrange
      const budgetData = {
        userId: '507f1f77bcf86cd799439011',
        month: 12,
        year: 2024,
        amount: 5000,
      };

      const mockResponse = {
        _id: '507f1f77bcf86cd799439012',
        ...budgetData,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
      });

      // Act
      const result = await apiFactory.budgets.create(budgetData);

      // Assert
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/budgets',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(budgetData),
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('apiFactory.budgets.getBudget', () => {
    it('should make GET request to /budgets/:userId/:month/:year', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const month = 12;
      const year = 2024;

      const mockResponse = {
        budget: {
          _id: '507f1f77bcf86cd799439012',
          userId,
          month,
          year,
          amount: 5000,
        },
        totalSpent: 3000,
        remaining: 2000,
        percentage: 60,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
      });

      // Act
      const result = await apiFactory.budgets.getBudget(userId, month, year);

      // Assert
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/budgets/507f1f77bcf86cd799439011/12/2024',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('apiFactory.budgets.getAllBudgets', () => {
    it('should make GET request to /budgets/all/:userId', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';

      const mockResponse = {
        budgets: [
          {
            budget: { _id: '1', month: 12, year: 2024, amount: 5000 },
            totalSpent: 3000,
            remaining: 2000,
            percentage: 60,
          },
        ],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
      });

      // Act
      const result = await apiFactory.budgets.getAllBudgets(userId);

      // Assert
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/budgets/all/507f1f77bcf86cd799439011',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('apiFactory.transactions.create', () => {
    it('should make POST request to /transactions with correct data', async () => {
      // Arrange
      const transactionData = {
        userId: '507f1f77bcf86cd799439011',
        amount: 100,
        type: 'expense',
        category: 'Food',
        date: '2024-12-17',
        description: 'Lunch',
      };

      const mockResponse = {
        _id: '507f1f77bcf86cd799439013',
        ...transactionData,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
      });

      // Act
      const result = await apiFactory.transactions.create(transactionData);

      // Assert
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/transactions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionData),
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('apiFactory.transactions.getUserTransactions', () => {
    it('should make GET request to /transactions/:userId', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';

      const mockResponse = {
        transactions: [
          {
            _id: '507f1f77bcf86cd799439013',
            userId,
            amount: 100,
            type: 'expense',
            category: 'Food',
            date: '2024-12-17',
          },
        ],
        summary: {
          totalIncome: 5000,
          totalExpense: 1000,
          balance: 4000,
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
      });

      // Act
      const result = await apiFactory.transactions.getUserTransactions(userId);

      // Assert
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/transactions/507f1f77bcf86cd799439011',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Arrange
      fetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(
        apiFactory.users.login({ email: 'test@example.com', password: '123' })
      ).rejects.toThrow('Network error');
    });

    it('should handle non-JSON error responses', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Not JSON');
        },
        text: async () => 'Internal Server Error',
      });

      // Act & Assert
      await expect(
        apiFactory.users.login({ email: 'test@example.com', password: '123' })
      ).rejects.toThrow();
    });

    it('should use error message from response when available', async () => {
      // Arrange
      const errorResponse = {
        message: 'Custom error message',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
        text: async () => JSON.stringify(errorResponse),
      });

      // Act & Assert
      await expect(
        apiFactory.users.login({ email: 'test@example.com', password: '123' })
      ).rejects.toThrow('Custom error message');
    });
  });
});
