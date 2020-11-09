import {
    DataDifferentialExpression,
    GOEnrichmentJson,
    GOEnrichmentNode,
    Relation,
    Storage,
} from '@genialis/resolwe/dist/api/types/rest';
import { Feature } from '@genialis/resolwe/dist/api/types/modules';
import { VariantType, SnackbarKey } from 'notistack';
import { Renderers } from 'vega';
import { LayoutBreakpoint } from 'components/genexpress/common/constants';

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
    species?: string;
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

export type VolcanoPoint = {
    geneId: string; // Feature (gene) id
    logFcValue: number;
    logProbValue: number;
    logProbFiniteValue: number;
    probValue: number;
};

export type Thresholds = {
    pValue: number;
    pValueLog: number;
    fc: number;
    fcLog: number;
};

export type DifferentialExpression = {
    logfc_threshold: number;
    prob_field: string;
    prob_threshold: number;
    up_regulated: number;
    down_regulated: number;
} & DataDifferentialExpression &
    Partial<Storage['json']>;

export type DifferentialExpressionsById = {
    [differentialExpressionId: number]: DifferentialExpression;
};

export type AspectValue = 'BP' | 'CC' | 'MF';
export type Aspect = {
    value: AspectValue;
    label: string;
};

export type EnhancedGOEnrichmentJson = {
    tree: {
        [aspectSlug: string]: GOEnrichmentRow[];
    };
} & Omit<GOEnrichmentJson, 'tree'>;

export type GOEnrichmentRow = {
    path: string[];
    children?: GOEnrichmentRow[];
    score_percentage: number;
    gene_associations: string[];
} & Omit<GOEnrichmentNode, 'children'>;

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

export type DictyRenderers = Exclude<Renderers, 'none'>;

export type BreakpointsCols = { [key in keyof typeof LayoutBreakpoint]: number };
