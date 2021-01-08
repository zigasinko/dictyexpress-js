import { Relation } from '@genialis/resolwe/dist/api/types/rest';
import { deserializeResponse } from '../utils/apiUtils';
import { apiUrl } from './base';
import { get } from './fetch';

const baseUrl = `${apiUrl}/relation`;

// eslint-disable-next-line import/prefer-default-export
export const getTimeSeriesRelations = async (): Promise<Relation[]> => {
    const getRelationsResponse = await get(baseUrl, { category: 'Time series' });

    return deserializeResponse<Relation[]>(getRelationsResponse);
};
