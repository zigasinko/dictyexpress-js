require('playwright-testing-library/extend');
// This is proxy for jest-playwright own setup async function as it gets overriden by our globalSetup
// eslint-disable-next-line @typescript-eslint/no-var-requires
const setup = require('jest-playwright-preset/setup');

module.exports = setup;
