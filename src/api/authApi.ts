import fetchApi from './fetch';
import { authApiUrl } from './base';

const loginUrl = `${authApiUrl}/login/`;
const logoutUrl = `${authApiUrl}/logout/`;

export const login = async (username: string, password: string): Promise<unknown> => {
    return fetchApi.post(loginUrl, { username, password });
};

export const logout = async (): Promise<unknown> => {
    return fetchApi.post(logoutUrl);
};
