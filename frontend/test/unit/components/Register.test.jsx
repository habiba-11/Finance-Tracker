// Register Component Unit Tests
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from '../../../src/components/Register.jsx';

// Mock global fetch
global.fetch = jest.fn();

describe('Register Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should render registration form with name, email, and password fields', () => {
    // Arrange & Act
    render(<Register />);

    // Assert
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('should update name field when user types', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Register />);
    const nameInput = screen.getByPlaceholderText('Name');

    // Act
    await user.type(nameInput, 'Test User');

    // Assert
    expect(nameInput).toHaveValue('Test User');
  });

  it('should update email field when user types', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Register />);
    const emailInput = screen.getByPlaceholderText('Email');

    // Act
    await user.type(emailInput, 'test@example.com');

    // Assert
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should update password field when user types', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Register />);
    const passwordInput = screen.getByPlaceholderText('Password');

    // Act
    await user.type(passwordInput, 'password123');

    // Assert
    expect(passwordInput).toHaveValue('password123');
  });

  it('should call API with correct user data on registration', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockResponse = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com',
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<Register />);

    const nameInput = screen.getByPlaceholderText('Name');
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const registerButton = screen.getByRole('button', { name: /register/i });

    // Act
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(registerButton);

    // Assert
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      });
    });
  });

  it('should display success message on successful registration', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockResponse = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com',
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<Register />);

    const nameInput = screen.getByPlaceholderText('Name');
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const registerButton = screen.getByRole('button', { name: /register/i });

    // Act
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(registerButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
    });
  });

  it('should display error message on failed registration', async () => {
    // Arrange
    const user = userEvent.setup();
    const errorResponse = {
      message: 'Email already exists',
    };

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => errorResponse,
    });

    render(<Register />);

    const nameInput = screen.getByPlaceholderText('Name');
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const registerButton = screen.getByRole('button', { name: /register/i });

    // Act
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(registerButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/error: email already exists/i)).toBeInTheDocument();
    });
  });

  it('should call onRegistered callback when registration is successful', async () => {
    // Arrange
    const user = userEvent.setup();
    const onRegisteredMock = jest.fn();
    const mockResponse = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com',
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<Register onRegistered={onRegisteredMock} />);

    const nameInput = screen.getByPlaceholderText('Name');
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const registerButton = screen.getByRole('button', { name: /register/i });

    // Act
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(registerButton);

    // Assert
    await waitFor(() => {
      expect(onRegisteredMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should not call onRegistered callback on failed registration', async () => {
    // Arrange
    const user = userEvent.setup();
    const onRegisteredMock = jest.fn();
    const errorResponse = {
      message: 'Email already exists',
    };

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => errorResponse,
    });

    render(<Register onRegistered={onRegisteredMock} />);

    const nameInput = screen.getByPlaceholderText('Name');
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const registerButton = screen.getByRole('button', { name: /register/i });

    // Act
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(registerButton);

    // Assert
    await waitFor(() => {
      expect(onRegisteredMock).not.toHaveBeenCalled();
    });
  });
});
