import {
    DataGafAnnotation,
    DataGOEnrichmentAnalysis,
    GOEnrichmentJson,
} from '@genialis/resolwe/dist/api/types/rest';
import { combineReducers, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { gOEnrichmentDataFetchSucceeded } from 'redux/epics/epicsActions';
import { EnhancedGOEnrichmentJson } from 'redux/models/internal';
import createIsFetchingSlice from './fetch';
import { allGenesDeselected, geneDeselected, genesSelected } from './genes';
import { timeSeriesSelected } from './timeSeries';

// State slices.
const gOEnrichmentJsonInitialState = {} as EnhancedGOEnrichmentJson;
const gOEnrichmentJsonSlice = createSlice({
    name: 'gOEnrichment',
    initialState: gOEnrichmentJsonInitialState,
    reducers: {
        fetchSucceeded: (
            _state,
            action: PayloadAction<EnhancedGOEnrichmentJson>,
        ): EnhancedGOEnrichmentJson => {
            return action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(
            timeSeriesSelected,
            (): EnhancedGOEnrichmentJson => {
                return gOEnrichmentJsonInitialState;
            },
        );
        builder.addCase(
            allGenesDeselected,
            (): EnhancedGOEnrichmentJson => {
                return gOEnrichmentJsonInitialState;
            },
        );
        builder.addCase(
            geneDeselected,
            (): EnhancedGOEnrichmentJson => {
                return gOEnrichmentJsonInitialState;
            },
        );
        builder.addCase(
            genesSelected,
            (): EnhancedGOEnrichmentJson => {
                return gOEnrichmentJsonInitialState;
            },
        );
    },
});

export const pValueThresholdsOptions = [0.1, 0.05, 0.01, 0.001, 0.0001];
const pValueThresholdInitialState = pValueThresholdsOptions[0];
const pValueThresholdSlice = createSlice({
    name: 'gOEnrichment',
    initialState: pValueThresholdInitialState,
    reducers: {
        pValueThresholdChanged: (_state, action: PayloadAction<number>): number => {
            return action.payload;
        },
    },
});

const speciesInitialState = '';
const speciesSlice = createSlice({
    name: 'gOEnrichment',
    initialState: speciesInitialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(
            gOEnrichmentDataFetchSucceeded,
            (_state, action: PayloadAction<DataGOEnrichmentAnalysis>): string => {
                return action.payload.output.species;
            },
        );
        builder.addCase(timeSeriesSelected, (): string => {
            return speciesInitialState;
        });
        builder.addCase(allGenesDeselected, (): string => {
            return speciesInitialState;
        });
    },
});

const sourceInitialState = '';
const sourceSlice = createSlice({
    name: 'gOEnrichment',
    initialState: sourceInitialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(
            gOEnrichmentDataFetchSucceeded,
            (_state, action: PayloadAction<DataGOEnrichmentAnalysis>): string => {
                return action.payload.output.source;
            },
        );
        builder.addCase(timeSeriesSelected, (): string => {
            return sourceInitialState;
        });
        builder.addCase(allGenesDeselected, (): string => {
            return sourceInitialState;
        });
    },
});

const gafInitialState = {} as DataGafAnnotation;
const gafSlice = createSlice({
    name: 'gOEnrichment',
    initialState: gafInitialState,
    reducers: {
        gafFetchSucceeded: (
            _state,
            action: PayloadAction<DataGafAnnotation>,
        ): DataGafAnnotation => {
            return action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(
            timeSeriesSelected,
            (): DataGafAnnotation => {
                return gafInitialState;
            },
        );
        builder.addCase(
            allGenesDeselected,
            (): DataGafAnnotation => {
                return gafInitialState;
            },
        );
    },
});

const isFetchingGOEnrichmentJsonSlice = createIsFetchingSlice('gOEnrichment');

const gOEnrichmentReducer = combineReducers({
    json: gOEnrichmentJsonSlice.reducer,
    gaf: gafSlice.reducer,
    isFetchingJson: isFetchingGOEnrichmentJsonSlice.reducer,
    pValueThreshold: pValueThresholdSlice.reducer,
    species: speciesSlice.reducer,
    source: sourceSlice.reducer,
});

// Export actions.
export const {
    started: gOEnrichmentJsonFetchStarted,
    ended: gOEnrichmentJsonFetchEnded,
} = isFetchingGOEnrichmentJsonSlice.actions;

export const { pValueThresholdChanged } = pValueThresholdSlice.actions;

export const { gafFetchSucceeded } = gafSlice.actions;

export const { fetchSucceeded: gOEnrichmentJsonFetchSucceeded } = gOEnrichmentJsonSlice.actions;

export type GOEnrichmentState = ReturnType<typeof gOEnrichmentReducer>;

export default gOEnrichmentReducer;

// Selectors (exposes the store to containers).
export const getIsFetchingGOEnrichmentJson = (state: GOEnrichmentState): boolean =>
    state.isFetchingJson;
export const getGOEnrichmentJson = (state: GOEnrichmentState): GOEnrichmentJson => state.json;
export const getPValueThreshold = (state: GOEnrichmentState): number => state.pValueThreshold;
export const getGaf = (state: GOEnrichmentState): DataGafAnnotation => state.gaf;
export const getGOEnrichmentSpecies = (state: GOEnrichmentState): string => state.species;
export const getGOEnrichmentSource = (state: GOEnrichmentState): string => state.source;
