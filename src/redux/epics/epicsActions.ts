import { DataGOEnrichmentAnalysis, Storage } from '@genialis/resolwe/dist/api/types/rest';
import { createAction } from '@reduxjs/toolkit';
import { Gene } from 'redux/models/internal';
import { ClusteringData, FindSimilarGenesData } from 'redux/models/rest';

// Export all epic-specific actions to omit dependency-cycles for reactive queries.
export const selectGenes = createAction<Gene[]>('genes/selectGenes');
export const pasteGenesNames = createAction<string[]>('genes/pasteGenesNames');
export const fetchTimeSeries = createAction('timeSeries/fetchTimeSeries');

export const login = createAction<{ username: string; password: string }>('authentication/login');
export const loginSucceeded = createAction('authentication/loginSucceeded');
export const logout = createAction('authentication/logout');
export const logoutSucceeded = createAction('authentication/logoutSucceeded');

export const appStarted = createAction('appStarted');
export const reconnectToServer = createAction('connectToServer/reconnect');
export const disconnectFromServer = createAction('connectToServer/disconnect');
export const connectionReady = createAction('connectToServer/connectionReady');

export type TFetchGenesActionPayload = {
    geneIds: string[];
    source?: string;
    species?: string;
};
export const fetchDifferentialExpressionGenes = createAction<TFetchGenesActionPayload>(
    'genes/fetchDifferentialExpressionGenes',
);
export const fetchBookmarkedGenes = createAction<TFetchGenesActionPayload>(
    'genes/fetchBookmarkedGenes',
);
export const fetchAssociationsGenes = createAction<TFetchGenesActionPayload>(
    'genes/fetchAssociationsGenes',
);
export const fetchSimilarGenes = createAction<TFetchGenesActionPayload>('genes/fetchSimilarGenes');
export const selectedGenesChanged = createAction<string[]>('genes/selectedGenesChanged');

export const getOrCreateGOEnrichment = createAction('gOEnrichment/getOrCreateGOEnrichment');
export const fetchGOEnrichmentData = createAction<number>('gOEnrichment/fetchGOEnrichmentData');
export const fetchGOEnrichmentStorage = createAction<number>(
    'gOEnrichment/fetchGOEnrichmentStorage',
);
export const gOEnrichmentDataFetchSucceeded = createAction<DataGOEnrichmentAnalysis>(
    'gOEnrichment/dataFetchSucceeded',
);

export const fetchClusteringData = createAction<number>('clustering/fetchClusteringData');
export const fetchClusteringDataSucceeded = createAction<ClusteringData>(
    'clustering/fetchClusteringDataSucceeded',
);
export const fetchClusteringStorageSucceeded = createAction<Storage>(
    'clustering/fetchClusteringStorageSucceeded',
);

export const fetchGenesSimilarities = createAction('similarGenes/fetchGenesSimilarities');
export const fetchGenesSimilaritiesData = createAction<number>(
    'similarGenes/fetchGenesSimilaritiesData',
);
export const fetchGenesSimilaritiesDataSucceeded = createAction<FindSimilarGenesData>(
    'similarGenes/fetchGenesSimilaritiesDataSucceeded',
);
export const fetchGenesSimilaritiesStorageSucceeded = createAction<Storage>(
    'similarGenes/fetchGenesSimilaritiesStorageSucceeded',
);
