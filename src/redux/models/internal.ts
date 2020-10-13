import { Relation } from '@genialis/resolwe/dist/api/types/rest';
import { Feature } from '@genialis/resolwe/dist/api/types/modules';
import { VariantType, SnackbarKey } from 'notistack';

export type Gene = Pick<
    Feature,
    'feature_id' | 'aliases' | 'name' | 'full_name' | 'description' | 'source' | 'species'
>;

export type RelationsById = {
    [_: number]: Relation;
};

export type GenesById = {
    [_: string]: Gene;
};

export type BasketInfo = {
    id: string;
    source: string;
    species: string;
    type: 'gene';
};

export type GeneSet = {
    dateTime: Date;
    genesNames: string[];
};

export type GeneExpression = {
    [geneId: string]: number;
};

export type SamplesExpressionsById = {
    [sampleId: number]: GeneExpression;
};

// If key is undefined, it will be generated in the reducer.
export type SnackbarNotificationContent = {
    key?: SnackbarKey;
    message: string;
    variant?: VariantType;
    action?: (key: number) => void;
};

// TODO, is this the correct way of going about making only one property required?
export type SnackbarNotification = {
    key: SnackbarKey;
} & Pick<SnackbarNotificationContent, 'message' | 'variant' | 'action'>;

export type SnackbarNotifications = SnackbarNotification[];
