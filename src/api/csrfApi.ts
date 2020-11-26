import fetch from './fetch';
import { apiUrl } from './base';

const baseUrl = `${apiUrl}/base/csrf`;

const getCSRFCookie = (): Promise<unknown> => {
    return fetch.get(baseUrl);
};

export default { getCSRFCookie };
