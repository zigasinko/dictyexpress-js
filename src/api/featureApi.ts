import { Gene } from '../redux/models/internal';
import { deserializeResponse } from '../utils/apiUtils';
import fetch from './fetch';
import { apiUrl } from './base';

const autocompleteUrl = `${apiUrl}/kb/feature/autocomplete`;
const searchUrl = `${apiUrl}/kb/feature/search`;

export const getGenes = async (
    source: string,
    type: string,
    value: string,
    species?: string,
    limit?: number,
): Promise<Gene[] | null> => {
    if (source === '' || value === '') {
        return null;
    }

    // Species property won't be included if it's null.
    const payload = {
        source: [source],
        type,
        query: value,
        limit,
        ...(species != null && { species: [species] }),
    };

    const getGenesResponse = await fetch.post(autocompleteUrl, payload);
    return deserializeResponse<Gene[]>(getGenesResponse);
};

export const getGenesByNames = async (
    source: string,
    type: string,
    genesNames: string[],
    species?: string,
): Promise<Gene[]> => {
    if (genesNames.length === 0) {
        throw new Error("Genes names can't be empty.");
    }

    const payload = {
        source: [source],
        type,
        query: genesNames.toString(),
        ...(species != null && { species: [species] }),
    };

    const getGenesResponse = await fetch.post(searchUrl, payload);
    return deserializeResponse<Gene[]>(getGenesResponse);
};
