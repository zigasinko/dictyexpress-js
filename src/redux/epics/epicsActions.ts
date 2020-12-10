import { DataGOEnrichmentAnalysis, Storage } from '@genialis/resolwe/dist/api/types/rest';
import { createAction } from '@reduxjs/toolkit';
import { Gene } from 'redux/models/internal';

// Export all epic-specific actions to omit dependency-cycles for reactive queries.
// TimeSeriesEpics.
export const selectGenes = createAction<Gene[]>('genes/selectGenes');
export const pasteGenesNames = createAction<string[]>('genes/pasteGenesNames');
export const fetchTimeSeries = createAction('timeSeries/fetchTimeSeries');
export const fetchTimeSeriesSamplesExpressions = createAction(
    'timeSeries/fetchTimeSeriesSamplesExpressions',
);
export const fetchDifferentialExpressionsData = createAction(
    'timeSeries/fetchDifferentialExpressionsData',
);

// AuthenticationEpics.
export const login = createAction<{ username: string; password: string }>('authentication/login');
export const loginSucceeded = createAction('authentication/loginSucceeded');
export const logout = createAction('authentication/logout');
export const logoutSucceeded = createAction('authentication/logoutSucceeded');

// ConnectToServerEpic.
export const appStarted = createAction('appStarted');
export const connectToServer = createAction<{
    url: string;
}>('connectToServer/connect');
export const reconnectToServer = createAction('connectToServer/reconnect');
export const disconnectFromServer = createAction('connectToServer/disconnect');
export const connectionReady = createAction('connectToServer/connectionReady');

// GenesEpics.
export const fetchSelectedDifferentialExpressionGenes = createAction(
    'genes/fetchSelectedDifferentialExpressionGenes',
);
export const fetchAssociationsGenes = createAction<{ geneIds: string[]; species?: string }>(
    'genes/fetchAssociationsGenes',
);

// GOEnrichmentEpics.
export const getOrCreateGOEnrichment = createAction('gOEnrichment/getOrCreateGOEnrichment');
export const fetchGOEnrichmentData = createAction<number>('gOEnrichment/fetchGOEnrichmentData');
export const fetchGOEnrichmentStorage = createAction<number>(
    'gOEnrichment/fetchGOEnrichmentStorage',
);
export const gafAlreadyFetched = createAction('gOEnrichment/gafAlreadyFetched');
export const gOEnrichmentDataFetchSucceeded = createAction<DataGOEnrichmentAnalysis>(
    'gOEnrichment/dataFetchSucceeded',
);

// ClusteringEpics.
export const fetchClusteringData = createAction<number>('clustering/fetchClusteringData');
export const fetchClusteringStorage = createAction<number>('clustering/fetchClusteringStorage');
export const fetchClusteringStorageSucceeded = createAction<Storage>(
    'clustering/fetchClusteringStorageSucceeded',
);
