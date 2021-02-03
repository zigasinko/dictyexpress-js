/* eslint-disable @typescript-eslint/explicit-function-return-type */
import '@testing-library/jest-dom/extend-expect';
import 'jest-canvas-mock';
import fetchMock from 'jest-fetch-mock';
import { JSDOM } from 'jsdom';

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

/**
 * Known issue with jsDom. Won't be needed once create-react-app updates jest to v26:
 * https://github.com/mui-org/material-ui/issues/15726
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
global.document.createRange = () => ({
    setStart: jest.fn(),
    setEnd: jest.fn(),
    commonAncestorContainer: {
        nodeName: 'BODY',
        ownerDocument: document,
    },
    createContextualFragment: (str: string) => JSDOM.fragment(str),
});
