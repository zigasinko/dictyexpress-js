import { authApiUrl } from './base';
import { post } from './fetch';

const loginUrl = `${authApiUrl}/login/`;
const logoutUrl = `${authApiUrl}/logout/`;

export const login = async (username: string, password: string): Promise<Response> => {
    return post(loginUrl, { username, password });
};

export const logout = async (): Promise<Response> => {
    return post(logoutUrl);
};
