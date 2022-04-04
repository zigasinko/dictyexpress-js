import { authApiUrl } from './base';
import { post } from './fetch';

const loginUrl = `${authApiUrl}/login/`;
const logoutUrl = `${authApiUrl}/logout/`;

export const login = async (email: string, password: string): Promise<Response> => {
    return post(loginUrl, { email, password });
};

export const logout = async (): Promise<Response> => {
    return post(logoutUrl);
};
