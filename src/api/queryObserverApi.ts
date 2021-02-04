import { post } from './fetch';
import { apiUrl } from './base';

const baseUrl = `${apiUrl}/queryobserver/unsubscribe`;

export const unsubscribe = async (observer: string, subscriber: string): Promise<void> => {
    const queryUrl = new URL(baseUrl);
    queryUrl.searchParams.append('observer', observer);
    queryUrl.searchParams.append('subscriber', subscriber);

    await post(queryUrl.toString());
};
