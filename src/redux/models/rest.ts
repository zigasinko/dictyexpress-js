import { Data } from '@genialis/resolwe/dist/api/types/rest';

export type BasketAddSamplesResponse = {
    id: string;
    modified: string;
    ignored: number[];
    permitted_organisms: string[];
    permitted_sources: string[];
    conflict_organisms: string[];
    conflict_sources: string[];
};

export type ClusteringData = {
    output: {
        cluster: number;
    };
} & Omit<Data, 'output'>;

export type ClusteringDistanceMeasure = 'spearman' | 'pearson';
export type ClusteringLinkageFunction = 'average' | 'complete' | 'single';

export type BasketExpressionRequest = {
    basket: string;
    tags?: string[];
};

export type BasketExpression = {
    id: number;
    exp_type: string;
};

export type BasketExpressionsResponse = BasketExpression[];
