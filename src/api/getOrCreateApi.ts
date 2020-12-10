import { Data } from '@genialis/resolwe/dist/api/types/rest';
import { ClusteringData } from 'redux/models/rest';
import { deserializeResponse } from '../utils/apiUtils';
import { post } from './fetch';
import { apiUrl } from './base';

const baseUrl = `${apiUrl}/data/get_or_create`;

export const getOrCreateGOEnrichmentData = async (input: object): Promise<Data> => {
    const payload = {
        process: {
            slug: 'goenrichment',
        },
        input,
    };

    return deserializeResponse<Data>(await post(baseUrl, payload));
};

export const getOrCreateClusteringData = async (input: object): Promise<ClusteringData> => {
    const payload = {
        process: {
            slug: 'clustering-hierarchical-etc',
        },
        input,
    };

    return deserializeResponse<ClusteringData>(await post(baseUrl, payload));
};
