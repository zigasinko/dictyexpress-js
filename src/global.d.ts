export declare global {
    const API_URL: string | null;
    const REST_AUTH_URL: string | null;
    const WEBSOCKET_URL: string | null;
    interface Window {
        API_URL?: string | null;
        REST_AUTH_URL?: string | null;
        WEBSOCKET_URL?: string | null;
    }
}
