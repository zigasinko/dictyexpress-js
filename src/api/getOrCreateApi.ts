import { Data } from '@genialis/resolwe/dist/api/types/rest';
import { deserializeResponse } from '../utils/apiUtils';
import { post } from './fetch';
import { apiUrl } from './base';

const baseUrl = `${apiUrl}/data/get_or_create`;

// eslint-disable-next-line import/prefer-default-export
export const getOrCreateGOEnrichmentData = async (input: object): Promise<Data> => {
    const payload = {
        process: {
            slug: 'goenrichment',
        },
        input,
    };

    return deserializeResponse<Data>(await post(baseUrl, payload));
};
