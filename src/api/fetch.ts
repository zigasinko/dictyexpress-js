import { getCookie } from '../utils/documentHelpers';

type QueryParams = { [key: string]: string };
type BodyParams = {};

/**
 * These methods do not require CSRF protection.
 * @param method - Method to check.
 * @returns True if the given method is safe (does not require CSRF cookie), false otherwise.
 */
const csrfSafeMethod = (method: string): boolean => {
    return /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);
};

/**
 * The fetch() API only rejects a promise when a “network error is encountered, although this usually means permissions issues or similar.”.
 * Basically fetch() will only reject a promise if the user is offline, or some unlikely networking error occurs, such a DNS lookup failure.
 * That's why if response isn't ok, an error is thrown and it should be handled in epics / calling component.
 * @param response - Received response.
 */
const throwErrorIfResponseNotOk = (response: Response): Response => {
    if (!response.ok) {
        throw new Error(`${response.status} - ${response.statusText}`);
    }

    return response;
};

const request = async (
    url: string,
    params?: QueryParams | BodyParams,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    ignoreErrors = false,
): Promise<Response> => {
    const headers = new Headers({ 'Content-Type': 'application/json' });

    /* If method requires csrf protection, extra header X-CSRFToken is needed:
     *  https://docs.djangoproject.com/en/3.0/ref/csrf/#ajax
     */
    if (!csrfSafeMethod(method)) {
        headers.append('X-CSRFToken', getCookie('csrftoken'));
    }

    const options: RequestInit = {
        method,
        headers,
    };

    /* Development is usually done via proxy, that's why cookies aren't sent through (not same origin).
     *  That's why credentials are set to "include" in development mode.
     */
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        options.credentials = 'include';
    }

    const fullUrl = new URL(url);
    // If params exists and method is GET, add query string to url
    // otherwise, just add params as a "body" property to the options object.
    if (params) {
        if (method === 'GET') {
            Object.keys(params).forEach((key) =>
                fullUrl.searchParams.append(key, (params as QueryParams)[key]),
            );
        } else {
            options.body = JSON.stringify(params as BodyParams);
        }
    }

    return fetch(fullUrl.toString(), options).then((response) =>
        ignoreErrors ? response : throwErrorIfResponseNotOk(response),
    );
};

const get = (url: string, params?: QueryParams, ignoreErrors?: boolean): Promise<Response> => {
    return request(url, params, 'GET', ignoreErrors);
};

const post = (url: string, params?: BodyParams, ignoreErrors?: boolean): Promise<Response> => {
    return request(url, params, 'POST', ignoreErrors);
};

const put = (url: string, params?: BodyParams, ignoreErrors?: boolean): Promise<Response> => {
    return request(url, params, 'PUT', ignoreErrors);
};

const remove = (url: string, params?: BodyParams, ignoreErrors?: boolean): Promise<Response> => {
    return request(url, params, 'DELETE', ignoreErrors);
};

export default {
    get,
    post,
    put,
    remove,
};
