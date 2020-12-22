export enum LocalStorageKey {
    geneSets = 'geneSets',
    layouts = 'layouts',
}

export enum ModulesKeys {
    timeSeriesAndGeneSelector = 'timeSeriesAndGeneSelector',
    expressionTimeCourses = 'expressionTimeCourses',
    differentialExpressions = 'differentialExpressions',
    gOEnrichment = 'gOEnrichment',
    clustering = 'clustering',
}

export enum LayoutBreakpoint {
    large = 'large',
    mid = 'mid',
    small = 'small',
}

export enum ClusteringLinkageFunction {
    average = 'average',
    complete = 'complete',
    single = 'single',
}

export enum DistanceMeasure {
    spearman = 'spearman',
    pearson = 'pearson',
}

export enum AspectValue {
    bp = 'BP',
    cc = 'CC',
    mf = 'MF',
}

export enum ProcessSlug {
    goEnrichment = 'goenrichment',
    clustering = 'clustering-hierarchical-etc',
    findSimilar = 'find-similar',
}

export const EMPTY_ARRAY = [];
