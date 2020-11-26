import { Data as SampleData } from '@genialis/resolwe/dist/api/types/rest';
import { deserializeResponse } from '../utils/apiUtils';
import fetch from './fetch';
import { apiUrl } from './base';

const baseUrl = `${apiUrl}/data`;

const getDataBySamplesIds = async (samplesIds: number[]): Promise<SampleData[]> => {
    if (samplesIds.length === 0) {
        return [] as SampleData[];
    }

    const getSamplesDataResponse = await fetch.get(baseUrl, {
        type: 'data:expression',
        entity__in: samplesIds.join(','),
    });

    return deserializeResponse<SampleData[]>(getSamplesDataResponse);
};

export default { getDataBySamplesIds };
