import { apiUrl } from './base';
import { get } from './fetch';

const baseUrl = `${apiUrl}/base/csrf`;

// eslint-disable-next-line import/prefer-default-export
export const getCSRFCookie = (): void => {
    void get(baseUrl);
};
