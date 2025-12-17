// Login Component Unit Tests
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../../src/components/Login.jsx';

// Mock global fetch
global.fetch = jest.fn();

describe('Login Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should render login form with email and password fields', () => {
    // Arrange & Act
    render(<Login />);

    // Assert
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should update email field when user types', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Login />);
    const emailInput = screen.getByPlaceholderText('Email');

    // Act
    await user.type(emailInput, 'test@example.com');

    // Assert
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should update password field when user types', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Login />);
    const passwordInput = screen.getByPlaceholderText('Password');

    // Act
    await user.type(passwordInput, 'password123');

    // Assert
    expect(passwordInput).toHaveValue('password123');
  });

  it('should call API with correct credentials on login', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockUserId = '507f1f77bcf86cd799439011';
    const mockResponse = {
      userId: mockUserId,
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const onLoginMock = jest.fn();
    render(<Login onLogin={onLoginMock} />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginButton = screen.getByRole('button', { name: /login/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    // Assert
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });
      expect(onLoginMock).toHaveBeenCalledWith(mockUserId);
    });
  });

  it('should display success message on successful login', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockResponse = {
      userId: '507f1f77bcf86cd799439011',
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<Login />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginButton = screen.getByRole('button', { name: /login/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/login successful/i)).toBeInTheDocument();
    });
  });

  it('should display error message on failed login', async () => {
    // Arrange
    const user = userEvent.setup();
    const errorResponse = {
      message: 'Invalid credentials',
    };

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => errorResponse,
    });

    render(<Login />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginButton = screen.getByRole('button', { name: /login/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(loginButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/error: invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should call onLogin callback when login is successful', async () => {
    // Arrange
    const user = userEvent.setup();
    const onLoginMock = jest.fn();
    const mockResponse = {
      userId: '507f1f77bcf86cd799439011',
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<Login onLogin={onLoginMock} />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginButton = screen.getByRole('button', { name: /login/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    // Assert
    await waitFor(() => {
      expect(onLoginMock).toHaveBeenCalledTimes(1);
      expect(onLoginMock).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  it('should not call onLogin callback if userId is not in response', async () => {
    // Arrange
    const user = userEvent.setup();
    const onLoginMock = jest.fn();
    const mockResponse = {
      token: 'some-token',
      // No userId
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<Login onLogin={onLoginMock} />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginButton = screen.getByRole('button', { name: /login/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    // Assert
    await waitFor(() => {
      expect(onLoginMock).not.toHaveBeenCalled();
    });
  });
});
