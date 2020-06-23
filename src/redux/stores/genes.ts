import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import _ from 'lodash';
import { Gene, GenesById } from 'redux/models/internal';
import createIsFetchingSlice from './fetch';
import { timeSeriesSelected } from './timeSeries';

// State slices.
const selectedGenesInitialState = {} as GenesById;
const selectedGenesSlice = createSlice({
    name: 'genes',
    initialState: selectedGenesInitialState,
    reducers: {
        selected: (state, action: PayloadAction<Gene>): GenesById => {
            return { ...state, [action.payload.name]: action.payload };
        },
        selectedMultiple: (_state, action: PayloadAction<Gene[]>): GenesById => {
            return _.keyBy(action.payload, 'name');
        },
        deselected: (state, action: PayloadAction<Gene>): GenesById => {
            const { [action.payload.name]: value, ...remainingGenes } = state;
            return remainingGenes;
        },
        deselectedAll: (): GenesById => {
            return selectedGenesInitialState;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(
            timeSeriesSelected,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            (_state, _action): GenesById => {
                return selectedGenesInitialState;
            },
        );
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
        highlightedMultiple: (state, action: PayloadAction<string[]>): string[] => {
            return [...action.payload];
        },
        unhighlighted: (state, action: PayloadAction<string>): string[] => {
            return state.filter((geneName) => action.payload !== geneName);
        },
    },
});

const isFetchingPastedGenesSlice = createIsFetchingSlice('genes');

const genesReducer = combineReducers({
    byId: selectedGenesSlice.reducer,
    highlightedGenesNames: highlightedGenesSlice.reducer,
    isFetchingPastedGenes: isFetchingPastedGenesSlice.reducer,
});

// Export actions.
export const {
    selectedMultiple: genesSelected,
    selected: geneSelected,
    deselected: geneDeselected,
    deselectedAll: allGenesDeselected,
} = selectedGenesSlice.actions;

export const {
    highlighted: geneHighlighted,
    highlightedMultiple: genesHighlighted,
    unhighlighted: geneUnhighlighted,
} = highlightedGenesSlice.actions;

export const {
    started: pastedGenesFetchStarted,
    ended: pastedGenesFetchEnded,
} = isFetchingPastedGenesSlice.actions;

export type GenesState = ReturnType<typeof genesReducer>;

export default genesReducer;

// Selectors (exposes the store to containers).
const byIdSelector = (state: GenesState): GenesById => state.byId;

export const getIsFetchingPastedGenes = (state: GenesState): boolean => state.isFetchingPastedGenes;

// createSelector function uses memoization so that only if byId slice changes it will get recomputed again.
export const getSelectedGenes = createSelector(byIdSelector, (genesById) => {
    return _.flatMap(genesById);
});

export const getHighlightedGenesNames = (state: GenesState): string[] =>
    state.highlightedGenesNames;
