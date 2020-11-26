import fetch from './fetch';
import { authApiUrl } from './base';

const loginUrl = `${authApiUrl}/login/`;
const logoutUrl = `${authApiUrl}/logout/`;

const login = async (username: string, password: string): Promise<Response> => {
    return fetch.post(loginUrl, { username, password }, true);
};

const logout = async (): Promise<Response> => {
    return fetch.post(logoutUrl);
};

export default { login, logout };
