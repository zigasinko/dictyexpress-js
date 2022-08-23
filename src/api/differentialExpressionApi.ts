import { DifferentialExpression } from '../redux/models/internal';
import { deserializeResponse } from '../utils/apiUtils';
import { apiUrl } from './base';
import { get } from './fetch';

const baseUrl = `${apiUrl}/_modules/differential_expression/list`;

export const getDifferentialExpressions = async (
    basketId: string | undefined,
): Promise<DifferentialExpression[]> => {
    if (basketId == null) {
        return [];
    }
    const getDifferentialExpressionsDataResponse = await get(baseUrl, {
        tags: `community:${COMMUNITY_SLUG}`,
    });

    return deserializeResponse<DifferentialExpression[]>(getDifferentialExpressionsDataResponse);
};
