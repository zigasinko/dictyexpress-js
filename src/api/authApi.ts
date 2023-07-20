import { authApiUrl, baseUrl } from './base';

const loginUrl = `${authApiUrl}/login/?next=${baseUrl}`;
const logoutUrl = `${authApiUrl}/logout/?next=${baseUrl}`;

export const login = () => {
    window.location.href = loginUrl;
};

export const logout = () => {
    window.location.href = logoutUrl;
};
