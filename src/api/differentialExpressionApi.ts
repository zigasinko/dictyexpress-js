import { DifferentialExpression } from '../redux/models/internal';
import { deserializeResponse } from '../utils/apiUtils';
import fetch from './fetch';
import { apiUrl } from './base';

const baseUrl = `${apiUrl}/_modules/differential_expression/list`;

// eslint-disable-next-line import/prefer-default-export
export const getDifferentialExpressions = async (
    basketId: string,
): Promise<DifferentialExpression[]> => {
    const getDifferentialExpressionsDataResponse = await fetch.get(baseUrl, {
        basket: basketId,
    });

    return deserializeResponse<DifferentialExpression[]>(getDifferentialExpressionsDataResponse);
};
