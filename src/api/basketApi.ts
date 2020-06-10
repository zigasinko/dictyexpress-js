import { BasketAddSamplesResponse } from '../redux/models/rest';
import { deserializeResponse } from '../utils/apiUtils';
import fetch from './fetch';
import { apiUrl } from './base';

const baseUrl = `${apiUrl}/basket`;

// eslint-disable-next-line import/prefer-default-export
export const addToBasket = async (samplesIds: number[]): Promise<BasketAddSamplesResponse> => {
    if (samplesIds == null || samplesIds.length === 0) {
        throw new Error('No samples to add to basket.');
    }

    const addSamplesResponse = await fetch.post(`${baseUrl}/_/add_samples`, {
        samples: samplesIds,
        only_existing_organism: true,
    });

    return deserializeResponse<BasketAddSamplesResponse>(addSamplesResponse);
};
