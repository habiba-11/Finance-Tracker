// Jest setup file - runs before each test file
import '@testing-library/jest-dom';

// Mock window.matchMedia if needed (for components that use media queries)
global.matchMedia = global.matchMedia || function(query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
};

// Mock window.scrollTo if needed
global.scrollTo = jest.fn();
