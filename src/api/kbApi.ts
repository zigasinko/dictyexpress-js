import { Gene, GeneMapping } from '../redux/models/internal';
import { deserializeResponse } from '../utils/apiUtils';
import { apiUrl } from './base';
import { post } from './fetch';

const autocompleteUrl = `${apiUrl}/kb/feature`;
const searchUrl = `${apiUrl}/kb/feature/paste`;
const mappingUrl = `${apiUrl}/kb/mapping/search`;

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

    const payload = {
        source: [source],
        type,
        query: value,
        limit,
        ...(species != null && { species: [species] }),
    };

    const getGenesResponse = await post(autocompleteUrl, payload);
    return deserializeResponse<Gene[]>(getGenesResponse);
};

export const getPastedGenes = async (
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
        pasted: genesNames,
        ...(species != null && { species: [species] }),
    };

    const getGenesResponse = await post(searchUrl, payload);
    return deserializeResponse<Gene[]>(getGenesResponse);
};

type GetGenesMappings = {
    (params: {
        sourceGenesIds: Gene['feature_id'][];
        targetDb: string;
        targetSpecies?: string;
    }): Promise<GeneMapping[]>;

    (params: {
        targetGenesIds: Gene['feature_id'][];
        sourceDb: string;
        sourceSpecies?: string;
    }): Promise<GeneMapping[]>;
};

export const mapGeneIdsBetweenSources: GetGenesMappings = async ({
    sourceGenesIds,
    targetGenesIds,
    sourceDb,
    targetDb,
    sourceSpecies,
    targetSpecies,
}: {
    sourceGenesIds?: Gene['feature_id'][];
    targetGenesIds?: Gene['feature_id'][];
    sourceDb?: string;
    targetDb?: string;
    sourceSpecies?: string;
    targetSpecies?: string;
}) => {
    const payload = {
        ...(sourceDb != null && { source_db: sourceDb }),
        ...(targetDb != null && { target_db: targetDb }),
        ...(sourceSpecies != null && { source_species: sourceSpecies }),
        ...(targetSpecies != null && { target_species: targetSpecies }),
        ...(sourceGenesIds != null && { source_id__in: sourceGenesIds.join(',') }),
        ...(targetGenesIds != null && { target_id__in: targetGenesIds.join(',') }),
    };

    const getGenesMapping = await post(mappingUrl, payload);
    return deserializeResponse<GeneMapping[]>(getGenesMapping);
};
