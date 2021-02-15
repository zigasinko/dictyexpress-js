import { Data } from '@genialis/resolwe/dist/api/types/rest';
import { ClusteringData } from 'redux/models/rest';
import { ProcessInfo } from 'redux/models/internal';
import { deserializeResponse } from '../utils/apiUtils';
import { post } from './fetch';
import { apiUrl } from './base';

const baseUrl = `${apiUrl}/data/get_or_create`;

// eslint-disable-next-line import/prefer-default-export
export const getOrCreateData = async <DataType extends Data>(
    input: Record<string, unknown>,
    slug: ProcessInfo['slug'],
): Promise<ClusteringData> => {
    const payload = {
        process: {
            slug,
        },
        input,
    };

    return deserializeResponse<DataType>(await post(baseUrl, payload));
};
