// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require('./jest.config');

module.exports = {
    launchOptions: {
        headless: process.env.CI === 'true',
        slowMo: process.env.SLOMO === 'true',
        devtools: false,
        exitOnPageError: true,
        timeout: 60e3,
    },
    contextOptions: {
        ignoreHTTPSErrors: true,
        viewport: {
            width: 1600,
            height: 700,
        },
    },
    browsers: ['chromium'],
    devices: [],
    serverOptions:
        process.env.START_BUILD_SERVER === 'true'
            ? {
                  command: 'npm run serve',
                  // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
                  port: parseInt(config.globals.baseURL.match(/(:(\d+))/)[2], 10),
              }
            : null,
};
