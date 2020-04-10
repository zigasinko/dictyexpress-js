/* eslint-disable func-names */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';

/**
 * Fix `matchMedia` not present, legacy browsers require a polyfill.
 */
window.matchMedia =
    window.matchMedia ||
    function () {
        return {
            matches: false,
            addListener() {},
            removeListener() {},
        };
    };
