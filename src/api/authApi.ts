import fetchApi from './fetch';
import { authApiUrl } from './base';

const baseUrl = `${authApiUrl}/login/`;

// eslint-disable-next-line import/prefer-default-export
export const auth = (): Promise<unknown> => {
    return fetchApi.post(baseUrl, { username: 'sziga', password: 'geslo1234' });
};
