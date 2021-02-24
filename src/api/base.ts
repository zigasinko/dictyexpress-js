import { v4 as uuidv4 } from 'uuid';

// eslint-disable-next-line no-restricted-globals
export const baseUrl = location.origin;
export const apiUrl = `${baseUrl}/api`;
export const authApiUrl = `${baseUrl}/rest-auth`;
export const webSocketUrl = `${baseUrl}/ws`;

export const sessionId = uuidv4();
