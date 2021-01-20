module.exports = {
    globals: {
        baseURL: 'http://localhost:3000',
    },
    extraGlobals: [],
    preset: 'jest-playwright-preset',
    testEnvironmentOptions: {},
    testMatch: [
        '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/**/*.{spec,test}.{js,jsx,ts,tsx}',
    ],
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'react-scripts/config/jest/babelTransform.js',
        '^.+\\.css$': 'react-scripts/config/jest/cssTransform.js',
        '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': 'react-scripts/config/jest/fileTransform.js',
    },
    setupFilesAfterEnv: ['<rootDir>/jestSetup.js'],
    verbose: true,
};
