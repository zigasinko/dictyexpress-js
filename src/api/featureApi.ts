import { Gene } from '../redux/models/internal';
import { deserializeResponse } from '../utils/apiUtils';
import fetch from './fetch';
import { apiUrl } from './base';

const autocompleteUrl = `${apiUrl}/kb/feature/autocomplete`;
const searchUrl = `${apiUrl}/kb/feature/search`;

export const getGenes = async (
    source: string,
    species: string,
    type: string,
    value: string,
    limit?: number,
): Promise<Gene[] | null> => {
    if (source === '' || species === '' || value === '') {
        return null;
    }

    const payload = {
        source: [source],
        species: [species],
        type,
        query: value,
        limit,
    };

    const getGenesResponse = await fetch.post(autocompleteUrl, payload);
    return deserializeResponse<Gene[]>(getGenesResponse);
};

export const getGenesByNames = async (
    source: string,
    species: string,
    type: string,
    genesNames: string[],
): Promise<Gene[] | null> => {
    if (genesNames.length === 0) {
        throw new Error("Genes names can't be empty.");
    }
    if (source === '' || species === '') {
        return null;
    }

    const payload = {
        source: [source],
        species: [species],
        type,
        query: genesNames.toString(),
    };

    const getGenesResponse = await fetch.post(searchUrl, payload);
    return deserializeResponse<Gene[]>(getGenesResponse);
};
