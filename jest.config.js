module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 5000000, // the more node involve in testing, the higher the timeout requires
  verbose: true,
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1', // Map @src to the src folder
  },
  roots: ['<rootDir>/test/unit'],
  setupFiles: ['<rootDir>/test/unit/setup.ts'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  resetMocks: true,
  clearMocks: true,
  collectCoverage: true,
}
