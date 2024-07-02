module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testTimeout: 5000000, // the more node involve in testing, the higher the timeout requires
    verbose: true,
    // roots: [
    //     "<rootDir>/test/"
    // ],
    testMatch: [
        "**/__tests__/**/*.+(ts|tsx|js)",
        "**/?(*.)+(spec|test).+(ts|tsx|js)"
    ],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },

}
