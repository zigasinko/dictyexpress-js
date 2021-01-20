module.exports = {
    launchOptions: {
        headless: process.env.CI === 'true',
        slowMo: false,
        devtools: false,
    },
    contextOptions: {
        ignoreHTTPSErrors: true,
        viewport: {
            width: 1025,
            height: 700,
        },
    },
    browsers: ['chromium'],
    devices: [],
};
