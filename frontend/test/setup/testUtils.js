// Shared test utilities
import React from 'react';
import { render } from '@testing-library/react';

/**
 * Custom render function that includes any providers needed for testing
 * Example: If you need to wrap components with Router, Context, etc.
 */
export const renderWithProviders = (ui, options = {}) => {
  // Add providers here if needed (Router, Context, etc.)
  return render(ui, options);
};

/**
 * Re-export everything from React Testing Library
 */
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
