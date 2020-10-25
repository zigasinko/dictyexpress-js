import {
    DataGafAnnotation,
    DataGOEnrichmentAnalysis,
    GOEnrichmentJson,
} from '@genialis/resolwe/dist/api/types/rest';
import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { findRow } from 'components/genexpress/modules/gOEnrichment/gOEnrichmentUtils';
import _ from 'lodash';
import { combineReducers } from 'redux';
import { EnhancedGOEnrichmentJson, GOEnrichmentRow } from 'redux/models/internal';
import createIsFetchingSlice from './fetch';
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
        rowToggled: (
            state,
            action: PayloadAction<{ aspect: string; row: GOEnrichmentRow }>,
        ): EnhancedGOEnrichmentJson => {
            // Find the row.
            const row = findRow(state.tree[action.payload.aspect], action.payload.row.term_name);
            if (row != null) {
                row.collapsed = !row?.collapsed;
            }

            // Update the row and return the state.
            return state;
        },
    },
});

const pValueThresholdInitialState = 0.1;
const pValueThresholdSlice = createSlice({
    name: 'gOEnrichment',
    initialState: pValueThresholdInitialState,
    reducers: {
        pValueThresholdChanged: (_state, action: PayloadAction<number>): number => {
            return action.payload;
        },
    },
});

const dataFetchSucceededAction = createAction<DataGOEnrichmentAnalysis>('gOEnrichment');

const speciesInitialState = '';
const speciesSlice = createSlice({
    name: 'gOEnrichment',
    initialState: speciesInitialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(
            dataFetchSucceededAction,
            (_state, action: PayloadAction<DataGOEnrichmentAnalysis>): string => {
                return action.payload.output.species;
            },
        );
    },
});

const sourceInitialState = '';
const sourceSlice = createSlice({
    name: 'gOEnrichment',
    initialState: sourceInitialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(
            dataFetchSucceededAction,
            (_state, action: PayloadAction<DataGOEnrichmentAnalysis>): string => {
                return action.payload.output.source;
            },
        );
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

export { dataFetchSucceededAction as gOEnrichmentDataFetchSucceeded };

export const { gafFetchSucceeded } = gafSlice.actions;

export const {
    fetchSucceeded: gOEnrichmentJsonFetchSucceeded,
    rowToggled: gOEnrichmentRowToggled,
} = gOEnrichmentJsonSlice.actions;

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
