import { Gene } from '../redux/models/internal';
import { deserializeResponse } from '../utils/apiUtils';
import fetch from './fetch';
import { apiUrl } from './base';

const baseUrl = `${apiUrl}/_modules/gene_list/list_by_ids?hydrate_full_feature=1`;

const listByIds = async (source: string, geneIds: string[], species?: string): Promise<Gene[]> => {
    if (geneIds.length === 0) {
        return [];
    }

    const payload = {
        source,
        gene_ids: geneIds,
        ...(species != null && { species }),
    };

    const getGenesResponse = await fetch.post(baseUrl, payload);
    return deserializeResponse<Gene[]>(getGenesResponse);
};

export default { listByIds };
