import { v4 as uuidv4 } from 'uuid';

export const apiUrl = `${process.env.REACT_APP_API_URL as string}`;
export const authApiUrl = `${process.env.REACT_APP_REST_AUTH_URL as string}`;
export const webSocketUrl = `${process.env.REACT_APP_WEBSOCKET_URL as string}`;

export const sessionId = uuidv4();
