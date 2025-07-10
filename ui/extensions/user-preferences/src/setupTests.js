// Use require instead of import for setupTests
require('@testing-library/jest-dom');

// Mock window confirm for delete functionality
global.confirm = jest.fn(() => true);

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};
