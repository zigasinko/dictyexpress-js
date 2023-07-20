/* eslint-disable @typescript-eslint/explicit-function-return-type */
import '@testing-library/jest-dom/extend-expect';
import 'jest-canvas-mock';
import fetchMock from 'jest-fetch-mock';

window.API_URL = null;
window.SAML_AUTH_URL = null;
window.WEBSOCKET_URL = null;
window.COMMUNITY_SLUG = 'test';
window.SELECTED_TIMESERIES_SLUG = 'test';

/**
 * Fix `matchMedia` not present, legacy browsers require a polyfill.
 */
window.matchMedia =
    window.matchMedia ||
    (() => {
        return {
            matches: false,
            addListener() {},
            removeListener() {},
        };
    });

fetchMock.enableMocks();
