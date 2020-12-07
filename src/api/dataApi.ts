import { Data as SampleData } from '@genialis/resolwe/dist/api/types/rest';
import { DifferentialExpression } from 'redux/models/internal';
import { deserializeResponse } from '../utils/apiUtils';
import fetch from './fetch';
import { apiUrl } from './base';

const baseUrl = `${apiUrl}/data`;
const differentialExpressionsUrl = `${apiUrl}/_modules/differential_expression/list`;

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

const getDifferentialExpressions = async (basketId: string): Promise<DifferentialExpression[]> => {
    const getDifferentialExpressionsDataResponse = await fetch.get(differentialExpressionsUrl, {
        basket: basketId,
    });

    return deserializeResponse<DifferentialExpression[]>(getDifferentialExpressionsDataResponse);
};

export default { getDataBySamplesIds, getDifferentialExpressions };
