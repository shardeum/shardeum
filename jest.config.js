module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 5000000, // the more node involve in testing, the higher the timeout requires
  verbose: true,
  roots: ['<rootDir>/test/unit','<rootDir>/test/testCases'],
  setupFiles: ['<rootDir>/test/unit/setup.ts'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  resetMocks: true,
  clearMocks: true,
}
