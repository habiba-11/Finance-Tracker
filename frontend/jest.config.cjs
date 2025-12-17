module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup/setupTests.js'],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'json'],
  
  // Transform files using Babel
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Module name mapper for CSS/styling imports
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/test/setup/fileMock.js',
  },
  
  // Test match pattern (look in test folder)
  testMatch: [
    '<rootDir>/test/**/*.test.js',
    '<rootDir>/test/**/*.test.jsx',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.d.ts',
    '!src/main.jsx',
    '!src/App.jsx', // Main app component, exclude from coverage
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/cypress/'],
  
  // Root directory
  rootDir: process.cwd(),
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  
  // Transform ignore patterns for node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(react-router-dom)/)',
  ],
};
