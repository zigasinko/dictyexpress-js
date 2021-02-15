/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { v4 as uuidv4 } from 'uuid';

export const apiUrl = `${process.env.REACT_APP_API_URL}`;
export const authApiUrl = `${process.env.REACT_APP_REST_AUTH_URL}`;
export const webSocketUrl = `${process.env.REACT_APP_WEBSOCKET_URL}`;

export const sessionId = uuidv4();
