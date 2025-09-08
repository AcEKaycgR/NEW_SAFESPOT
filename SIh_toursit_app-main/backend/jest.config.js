/** @type {import('jest').Config} */
const config = {
  rootDir: './',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  // Run tests sequentially to avoid database conflicts
  maxWorkers: 1,
  // Global test timeout
  testTimeout: 30000,
  // Setup and teardown
  setupFilesAfterEnv: [],
  // Ensure tests run in isolation
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
};

module.exports = config;
