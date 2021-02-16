const port = 'PORT' in process.env ? Number(process.env.PORT) : 3000;

module.exports = {
    globals: {
        baseURL: 'http://localhost:'.concat(port),
        port,
    },
    extraGlobals: [],
    preset: 'jest-playwright-preset',
    globalSetup: '<rootDir>/jestGlobalSetup.js',
    setupFilesAfterEnv: ['<rootDir>/jestSetupAfterEnv.js'],
    testMatch: [
        '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/**/*.{spec,test}.{js,jsx,ts,tsx}',
    ],
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'react-scripts/config/jest/babelTransform.js',
        '^.+\\.css$': 'react-scripts/config/jest/cssTransform.js',
        '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': 'react-scripts/config/jest/fileTransform.js',
    },
    verbose: true,
};
