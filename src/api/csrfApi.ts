import fetch from './fetch';
import { apiUrl } from './base';

const baseUrl = `${apiUrl}/base/csrf`;

// eslint-disable-next-line import/prefer-default-export
export const getCSRFCookie = (): Promise<unknown> => {
    return fetch.get(baseUrl);
};
