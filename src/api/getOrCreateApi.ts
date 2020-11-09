import { Data } from '@genialis/resolwe/dist/api/types/rest';
import { deserializeResponse } from '../utils/apiUtils';
import fetch from './fetch';
import { apiUrl } from './base';

const baseUrl = `${apiUrl}/data/get_or_create`;

const getOrCreateGOEnrichmentData = async (input: object): Promise<Data> => {
    const payload = {
        process: {
            slug: 'goenrichment',
        },
        input,
    };

    return deserializeResponse<Data>(await fetch.post(baseUrl, payload));
};

export default { getOrCreateGOEnrichmentData };
