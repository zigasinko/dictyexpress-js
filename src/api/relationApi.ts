import { Relation } from '@genialis/resolwe/dist/api/types/rest';
import { deserializeResponse } from '../utils/apiUtils';
import fetch from './fetch';
import { apiUrl } from './base';

const baseUrl = `${apiUrl}/relation`;

// eslint-disable-next-line import/prefer-default-export
export const getTimeSeriesRelations = async (): Promise<Relation[]> => {
    const getRelationsResponse = await fetch.get(baseUrl, { category: 'Time series' });

    return deserializeResponse<Relation[]>(getRelationsResponse);
};
