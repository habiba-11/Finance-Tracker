// AddTransaction Component Unit Tests
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddTransaction from '../../../src/components/AddTransaction.jsx';

// Mock global fetch
global.fetch = jest.fn();

describe('AddTransaction Component', () => {
  const mockUserId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    fetch.mockClear();
  });

  it('should render transaction form with all fields', () => {
    // Arrange & Act
    render(<AddTransaction userId={mockUserId} />);

    // Assert
    expect(screen.getByPlaceholderText('Amount')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument(); // select element
    expect(screen.getByPlaceholderText('Category')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Description (optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
  });

  it('should have expense as default transaction type', () => {
    // Arrange & Act
    render(<AddTransaction userId={mockUserId} />);

    // Assert
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveValue('expense');
  });

  it('should update amount field when user types', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<AddTransaction userId={mockUserId} />);
    const amountInput = screen.getByPlaceholderText('Amount');

    // Act
    await user.type(amountInput, '100.50');

    // Assert
    expect(amountInput).toHaveValue(100.5);
  });

  it('should update transaction type when user selects', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<AddTransaction userId={mockUserId} />);
    const selectElement = screen.getByRole('combobox');

    // Act
    await user.selectOptions(selectElement, 'income');

    // Assert
    expect(selectElement).toHaveValue('income');
  });

  it('should call API with correct transaction data on submit', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockResponse = {
      _id: '507f1f77bcf86cd799439012',
      userId: mockUserId,
      amount: 100,
      type: 'expense',
      category: 'Food',
      date: '2024-12-17',
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<AddTransaction userId={mockUserId} />);

    const amountInput = screen.getByPlaceholderText('Amount');
    const categoryInput = screen.getByPlaceholderText('Category');
    // Date input - use querySelector directly to avoid multiple matches
    const dateInput = document.querySelector('input[type="date"]');
    const submitButton = screen.getByRole('button', { name: /add transaction/i });

    // Act
    await user.clear(amountInput);
    await user.type(amountInput, '100');
    await user.clear(categoryInput);
    await user.type(categoryInput, 'Food');
    // Date field is optional - component will use empty string if not set
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining(`"userId":"${mockUserId}"`),
      });
      // Verify the body contains the essential fields
      const postCalls = fetch.mock.calls.filter(call => call[0] === 'http://localhost:3000/transactions');
      expect(postCalls.length).toBeGreaterThan(0);
      const body = JSON.parse(postCalls[0][1].body);
      expect(body.userId).toBe(mockUserId);
      expect(body.amount).toBe(100);
      expect(body.type).toBe('expense');
      expect(body.category).toBe('Food');
    });
  });

  it('should display success message on successful transaction creation', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockResponse = {
      _id: '507f1f77bcf86cd799439012',
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<AddTransaction userId={mockUserId} />);

    const amountInput = screen.getByPlaceholderText('Amount');
    const categoryInput = screen.getByPlaceholderText('Category');
    const submitButton = screen.getByRole('button', { name: /add transaction/i });

    // Act
    await user.clear(amountInput);
    await user.type(amountInput, '100');
    await user.clear(categoryInput);
    await user.type(categoryInput, 'Food');
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/transaction added successfully/i)).toBeInTheDocument();
    });
  });

  it('should clear form fields after successful transaction creation', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockResponse = {
      _id: '507f1f77bcf86cd799439012',
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<AddTransaction userId={mockUserId} />);

    const amountInput = screen.getByPlaceholderText('Amount');
    const categoryInput = screen.getByPlaceholderText('Category');
    const submitButton = screen.getByRole('button', { name: /add transaction/i });

    // Act
    await user.clear(amountInput);
    await user.type(amountInput, '100');
    await user.clear(categoryInput);
    await user.type(categoryInput, 'Food');
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(amountInput).toHaveValue(null);
      expect(categoryInput).toHaveValue('');
    });
  });

  it('should display error message on failed transaction creation', async () => {
    // Arrange
    const user = userEvent.setup();
    const errorResponse = {
      message: 'Invalid transaction data',
    };

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => errorResponse,
    });

    render(<AddTransaction userId={mockUserId} />);

    const amountInput = screen.getByPlaceholderText('Amount');
    const submitButton = screen.getByRole('button', { name: /add transaction/i });

    // Act
    await user.clear(amountInput);
    await user.type(amountInput, '100');
    await user.click(submitButton);

    // Assert - Component displays error in <pre> tag with format "Error: {message}"
    await waitFor(() => {
      // The message is displayed as "Error: Invalid transaction data" in a <pre> tag
      const messageElement = document.querySelector('pre');
      expect(messageElement).toBeInTheDocument();
      expect(messageElement?.textContent).toMatch(/error:/i);
      expect(messageElement?.textContent).toMatch(/invalid transaction data/i);
    });
  });

  it('should display error message when userId is not provided', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<AddTransaction />); // No userId prop

    const amountInput = screen.getByPlaceholderText('Amount');
    const submitButton = screen.getByRole('button', { name: /add transaction/i });

    // Act
    await user.type(amountInput, '100');
    await user.click(submitButton);

    // Assert - Component shows "You must be logged in to add a transaction."
    await waitFor(() => {
      expect(screen.getByText(/you must be logged in to add a transaction/i)).toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  it('should handle network errors gracefully', async () => {
    // Arrange
    const user = userEvent.setup();
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<AddTransaction userId={mockUserId} />);

    const amountInput = screen.getByPlaceholderText('Amount');
    const submitButton = screen.getByRole('button', { name: /add transaction/i });

    // Act
    await user.clear(amountInput);
    await user.type(amountInput, '100');
    await user.click(submitButton);

    // Assert - Component shows "Network error: could not reach server" in <pre> tag
    await waitFor(() => {
      const messageElement = document.querySelector('pre');
      expect(messageElement).toBeInTheDocument();
      expect(messageElement?.textContent).toMatch(/network error: could not reach server/i);
    });
  });

  it('should allow adding income transactions', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockResponse = {
      _id: '507f1f77bcf86cd799439012',
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<AddTransaction userId={mockUserId} />);

    const selectElement = screen.getByRole('combobox');
    const amountInput = screen.getByPlaceholderText('Amount');
    const submitButton = screen.getByRole('button', { name: /add transaction/i });

    // Act
    await user.selectOptions(selectElement, 'income');
    await user.clear(amountInput);
    await user.type(amountInput, '500');
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/transactions',
        expect.objectContaining({
          body: expect.stringContaining('"type":"income"'),
        })
      );
    });
  });
});
