import fetch from './fetch';
import { apiUrl } from './base';

const baseUrl = `${apiUrl}/queryobserver/unsubscribe`;

// eslint-disable-next-line import/prefer-default-export
export const unsubscribe = async (observer: string, subscriber: string): Promise<unknown> => {
    const queryUrl = new URL(baseUrl);
    queryUrl.searchParams.append('observer', observer);
    queryUrl.searchParams.append('subscriber', subscriber);

    return fetch.post(queryUrl.toString());
};
