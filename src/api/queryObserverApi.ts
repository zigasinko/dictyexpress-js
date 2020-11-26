import fetchApi from './fetch';
import { apiUrl } from './base';

const baseUrl = `${apiUrl}/queryobserver/unsubscribe`;

const unsubscribe = async (observer: string, subscriber: string): Promise<unknown> => {
    const queryUrl = new URL(baseUrl);
    queryUrl.searchParams.append('observer', observer);
    queryUrl.searchParams.append('subscriber', subscriber);

    return fetchApi.post(queryUrl.toString());
};

export default { unsubscribe };
