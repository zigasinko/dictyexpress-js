import { jest } from '@jest/globals';

jest.setTimeout(300e3);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { toMatchImageSnapshot } = require('jest-image-snapshot');

expect.extend({ toMatchImageSnapshot });
