import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import _ from 'lodash';
import { Gene, GenesById } from 'redux/models/internal';
import { timeSeriesSelected } from './timeSeries';
import createIsFetchingSlice from './fetch';

// State slices.
const genesByIdInitialState = {} as GenesById;
const genesByIdSlice = createSlice({
    name: 'genes',
    initialState: genesByIdInitialState,
    reducers: {
        fetchSucceeded: (state, action: PayloadAction<Gene[]>): GenesById => {
            const newState = { ...state, ..._.keyBy(action.payload, 'feature_id') };
            return newState;
        },
    },
});

const selectedGenesIdsInitialState = [] as string[];
const selectedGenesIdsSlice = createSlice({
    name: 'genes',
    initialState: selectedGenesIdsInitialState,
    reducers: {
        selectedMultiple: (state, action: PayloadAction<string[]>): string[] => {
            return _.uniq([...state, ...action.payload]);
        },
        deselected: (state, action: PayloadAction<string>): string[] => {
            return state.filter((geneId) => geneId !== action.payload);
        },
        deselectedAll: (): string[] => {
            return selectedGenesIdsInitialState;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(timeSeriesSelected, (): string[] => {
            return selectedGenesIdsInitialState;
        });
    },
});

const highlightedGenesInitialState = [] as string[];
const highlightedGenesSlice = createSlice({
    name: 'genes',
    initialState: highlightedGenesInitialState,
    reducers: {
        highlighted: (state, action: PayloadAction<string>): string[] => {
            return [...state, action.payload];
        },
        highlightedMultiple: (_state, action: PayloadAction<string[]>): string[] => {
            return [...action.payload];
        },
        unhighlighted: (state, action: PayloadAction<string>): string[] => {
            return state.filter((geneId) => action.payload !== geneId);
        },
    },
    extraReducers: (builder) => {
        builder.addCase(
            selectedGenesIdsSlice.actions.deselected,
            (state, action: PayloadAction<string>): string[] => {
                return state.filter((highlightedGeneId) => action.payload !== highlightedGeneId);
            },
        );
        builder.addCase(timeSeriesSelected, (): string[] => {
            return highlightedGenesInitialState;
        });
        builder.addCase(selectedGenesIdsSlice.actions.deselectedAll, (): string[] => {
            return highlightedGenesInitialState;
        });
    },
});

const isFetchingDifferentialExpressionGenesSlice = createIsFetchingSlice('genes');

const genesReducer = combineReducers({
    byId: genesByIdSlice.reducer,
    selectedGenesIds: selectedGenesIdsSlice.reducer,
    highlightedGenesIds: highlightedGenesSlice.reducer,
    isFetchingDifferentialExpressionGenes: isFetchingDifferentialExpressionGenesSlice.reducer,
});

// Export actions.
export const { fetchSucceeded: genesFetchSucceeded } = genesByIdSlice.actions;

export const {
    selectedMultiple: genesSelected,
    deselected: geneDeselected,
    deselectedAll: allGenesDeselected,
} = selectedGenesIdsSlice.actions;

export const {
    highlighted: geneHighlighted,
    highlightedMultiple: genesHighlighted,
    unhighlighted: geneUnhighlighted,
} = highlightedGenesSlice.actions;

export const {
    started: differentialExpressionGenesFetchStarted,
    ended: differentialExpressionGenesFetchEnded,
} = isFetchingDifferentialExpressionGenesSlice.actions;

export type GenesState = ReturnType<typeof genesReducer>;

export default genesReducer;

// Selectors (exposes the store to containers).
const getGenesById = (state: GenesState): GenesById => state.byId;
export const getSelectedGenesIds = (state: GenesState): string[] => state.selectedGenesIds;

// createSelector function uses memoization so that only if byId slice changes it will get recomputed again.
export const getSelectedGenes = createSelector(
    getGenesById,
    getSelectedGenesIds,
    (genesById, selectedGenesIds) => {
        return selectedGenesIds.map((geneId) => genesById[geneId]);
    },
);

export const getGenes = createSelector(getGenesById, (genesById) => _.flatMap(genesById));
export const getGenesIdsInStore = createSelector(getGenes, (genes) =>
    genes.map((gene) => gene.feature_id),
);

export const getHighlightedGenesIds = (state: GenesState): string[] => state.highlightedGenesIds;
