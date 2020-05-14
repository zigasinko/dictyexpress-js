import { Relation } from '@genialis/resolwe/dist/api/types/rest';
import { Feature } from '@genialis/resolwe/dist/api/types/modules';

export type Gene = Pick<
    Feature,
    'feature_id' | 'aliases' | 'name' | 'full_name' | 'description' | 'source' | 'species'
>;

export type RelationsById = {
    [_: string]: Relation;
};

export type GenesById = {
    [_: string]: Gene;
};

export type SamplesInfo = {
    source: string;
    species: string;
    type: 'gene';
};

export type GeneSet = {
    dateTime: Date;
    genesNames: string[];
};
