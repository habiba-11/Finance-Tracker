// BudgetForm Component Unit Tests
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BudgetForm from '../../../src/components/BudgetForm.jsx';

// Mock global fetch
global.fetch = jest.fn();

describe('BudgetForm Component', () => {
  const mockUserId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    fetch.mockClear();
    // Note: Date mocking is tricky - component uses new Date() in useState initializers
    // We'll let it use the real date and adjust test expectations accordingly
  });

  it('should render budget form with month, year, and amount fields', () => {
    // Arrange & Act
    render(<BudgetForm userId={mockUserId} />);

    // Assert
    expect(screen.getByLabelText(/month:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/year:/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Budget Amount')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set budget/i })).toBeInTheDocument();
  });

  it('should have current month and year as default values', () => {
    // Arrange & Act
    render(<BudgetForm userId={mockUserId} />);

    // Assert - Check that month and year inputs exist and have values
    const monthSelect = screen.getByLabelText(/month:/i);
    const yearInput = screen.getByLabelText(/year:/i);
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const currentYear = new Date().getFullYear();
    expect(monthSelect).toHaveValue(String(currentMonth));
    expect(yearInput).toHaveValue(currentYear);
  });

  it('should fetch budget data when component mounts', async () => {
    // Arrange
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const mockBudgetResponse = {
      budget: {
        _id: '507f1f77bcf86cd799439013',
        userId: mockUserId,
        month: currentMonth,
        year: currentYear,
        amount: 5000,
      },
      totalSpent: 3000,
      remaining: 2000,
      percentage: 60,
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBudgetResponse,
    });

    // Act
    render(<BudgetForm userId={mockUserId} />);

    // Assert - fetch is called without second parameter (GET request)
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3000/budgets/${mockUserId}/${currentMonth}/${currentYear}`
      );
    });
  });

  it('should update amount field when user types', async () => {
    // Arrange
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'No budget found' }),
    });
    render(<BudgetForm userId={mockUserId} />);
    
    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    }, { timeout: 3000 });

    const amountInput = screen.getByPlaceholderText('Budget Amount');

    // Act - Clear first, then type
    await user.clear(amountInput);
    await user.type(amountInput, '5000');

    // Assert - Input should have the typed value
    expect(Number(amountInput.value)).toBe(5000);
  }, 10000); // Increase test timeout

  it('should call API with correct budget data on submit', async () => {
    // Arrange
    const user = userEvent.setup();
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const mockResponse = {
      _id: '507f1f77bcf86cd799439013',
      userId: mockUserId,
      month: currentMonth,
      year: currentYear,
      amount: 5000,
    };

    // Mock initial fetch (for useEffect)
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'No budget found' }),
    });

    // Mock create budget response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Mock fetch after budget creation (refresh)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        budget: mockResponse,
        totalSpent: 0,
        remaining: 5000,
        percentage: 0,
      }),
    });

    render(<BudgetForm userId={mockUserId} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    const amountInput = screen.getByPlaceholderText('Budget Amount');
    const submitButton = screen.getByRole('button', { name: /set budget/i });

    // Act
    await user.clear(amountInput);
    await user.type(amountInput, '5000');
    await user.click(submitButton);

    // Assert - Check that POST request was made
    await waitFor(() => {
      const postCall = fetch.mock.calls.find(call => 
        call[0] === 'http://localhost:3000/budgets' && 
        call[1]?.method === 'POST'
      );
      expect(postCall).toBeDefined();
      if (postCall) {
        const body = JSON.parse(postCall[1].body);
        expect(body.userId).toBe(mockUserId);
        expect(body.month).toBe(currentMonth);
        expect(body.year).toBe(currentYear);
        expect(body.amount).toBe(5000);
      }
    });
  });

  it('should create budget and refresh budget data on successful budget creation', async () => {
    // Arrange
    const user = userEvent.setup();
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const mockResponse = {
      _id: '507f1f77bcf86cd799439013',
      userId: mockUserId,
      month: currentMonth,
      year: currentYear,
      amount: 5000,
    };

    // Mock initial fetch (for useEffect)
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'No budget found' }),
    });

    // Mock create budget response (POST)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Mock fetch after budget creation (refresh - GET)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        budget: mockResponse,
        totalSpent: 0,
        remaining: 5000,
        percentage: 0,
      }),
    });

    render(<BudgetForm userId={mockUserId} />);

    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    }, { timeout: 3000 });

    const amountInput = screen.getByPlaceholderText('Budget Amount');
    const submitButton = screen.getByRole('button', { name: /set budget/i });

    // Act
    await user.clear(amountInput);
    await user.type(amountInput, '5000');
    await user.click(submitButton);

    // Assert - After successful creation, fetchBudgetData is called which clears the success message
    // Verify success by checking that budget data was refreshed and summary appears with new budget
    await waitFor(() => {
      // Verify POST request was made
      const postCall = fetch.mock.calls.find(call => 
        call[0] === 'http://localhost:3000/budgets' && 
        call[1]?.method === 'POST'
      );
      expect(postCall).toBeDefined();
    }, { timeout: 3000 });
    
    // Wait for budget data to refresh - budget summary should appear with the newly created budget
    await waitFor(() => {
      expect(screen.getByText(/budget summary/i)).toBeInTheDocument();
      // The refresh should show the budget was created - check that $5000 appears (multiple places is fine)
      const all5000Elements = screen.getAllByText(/\$5000/);
      expect(all5000Elements.length).toBeGreaterThan(0);
      // Also verify budget amount label exists
      expect(screen.getByText(/budget amount:/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display error message when amount is invalid', async () => {
    // Arrange
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'No budget found' }),
    });
    render(<BudgetForm userId={mockUserId} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    const amountInput = screen.getByPlaceholderText('Budget Amount');
    const submitButton = screen.getByRole('button', { name: /set budget/i });

    // Act - submit with invalid amount (0 or negative)
    await user.clear(amountInput);
    await user.type(amountInput, '0');
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid budget amount/i)).toBeInTheDocument();
    });
    // Check fetch was only called once (initial fetch, not the create)
    expect(fetch.mock.calls.filter(call => call[0].includes('/budgets') && !call[0].includes('/budgets/' + mockUserId))).toHaveLength(0);
  });

  it('should display error message when userId is not provided', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<BudgetForm />); // No userId prop

    const amountInput = screen.getByPlaceholderText('Budget Amount');
    const submitButton = screen.getByRole('button', { name: /set budget/i });

    // Act
    await user.clear(amountInput);
    await user.type(amountInput, '5000');
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/you must be logged in to set a budget/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display budget summary when budget data is fetched', async () => {
    // Arrange
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const mockBudgetResponse = {
      budget: {
        _id: '507f1f77bcf86cd799439013',
        userId: mockUserId,
        month: currentMonth,
        year: currentYear,
        amount: 5000,
      },
      totalSpent: 3000,
      remaining: 2000,
      percentage: 60,
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBudgetResponse,
    });

    // Act
    render(<BudgetForm userId={mockUserId} />);

    // Assert - Wait for budget data to load and display
    await waitFor(() => {
      expect(screen.getByText(/budget summary/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check for values in the summary
    expect(screen.getByText(/\$5000/)).toBeInTheDocument(); // Budget Amount
    expect(screen.getByText(/\$3000/)).toBeInTheDocument(); // Total Spent
    expect(screen.getByText(/\$2000/)).toBeInTheDocument(); // Remaining
    expect(screen.getByText(/60%/)).toBeInTheDocument(); // Percentage
  });

  it('should display warning when budget usage exceeds 90%', async () => {
    // Arrange
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const mockBudgetResponse = {
      budget: {
        _id: '507f1f77bcf86cd799439013',
        userId: mockUserId,
        month: currentMonth,
        year: currentYear,
        amount: 5000,
      },
      totalSpent: 4600,
      remaining: 400,
      percentage: 92,
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBudgetResponse,
    });

    // Act
    render(<BudgetForm userId={mockUserId} />);

    // Assert - Wait for fetch to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    }, { timeout: 3000 });
    
    // Wait for budget summary and warning to appear
    await waitFor(() => {
      expect(screen.getByText(/budget summary/i)).toBeInTheDocument();
      expect(screen.getByText(/⚠ warning: you've exceeded 90% of your budget!/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
