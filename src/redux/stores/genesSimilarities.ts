import { createSlice, PayloadAction, combineReducers } from '@reduxjs/toolkit';
import { DistanceMeasure } from 'components/genexpress/common/constants';
import { GeneSimilarity } from 'redux/models/internal';
import { clearStateOnActions } from './common';
import createIsFetchingSlice from './fetch';
import { timeSeriesSelected } from './timeSeries';

// State slices.
const queryGeneIdInitialState = null;
const queryGeneIdSlice = createSlice({
    name: 'genesSimilarities',
    initialState: queryGeneIdInitialState as string | null,
    reducers: {
        // Selected by user (fetch happens immediately).
        selected: (_state, action: PayloadAction<string | null>): string | null => {
            return action.payload;
        },
        // Set via changing selected genes (e.g. existing query gene was deselected).
        set: (_state, action: PayloadAction<string | null>): string | null => {
            return action.payload;
        },
    },
    extraReducers: (builder) => {
        clearStateOnActions(builder, [timeSeriesSelected], queryGeneIdInitialState);
    },
});

const distanceMeasureInitialState = 'spearman' as DistanceMeasure;
const distanceMeasureSlice = createSlice({
    name: 'genesSimilarities',
    initialState: distanceMeasureInitialState,
    reducers: {
        distanceMeasureChanged: (
            _state,
            action: PayloadAction<DistanceMeasure>,
        ): DistanceMeasure => {
            return action.payload;
        },
    },
});

const genesSimilaritiesInitialState = null as GeneSimilarity[] | null;
const genesSimilaritiesSlice = createSlice({
    name: 'genesSimilarities',
    initialState: genesSimilaritiesInitialState,
    reducers: {
        fetchSucceeded: (_state, action: PayloadAction<GeneSimilarity[]>): GeneSimilarity[] => {
            return action.payload;
        },
    },
    extraReducers: (builder) => {
        clearStateOnActions(
            builder,
            [
                queryGeneIdSlice.actions.selected,
                queryGeneIdSlice.actions.set,
                distanceMeasureSlice.actions.distanceMeasureChanged,
            ],
            genesSimilaritiesInitialState,
        );
    },
});

const isFetchingGenesSimilaritiesSlice = createIsFetchingSlice('genesSimilarities');

const genesSimilaritiesReducer = combineReducers({
    data: genesSimilaritiesSlice.reducer,
    queryGeneId: queryGeneIdSlice.reducer,
    distanceMeasure: distanceMeasureSlice.reducer,
    isFetchingGenesSimilarities: isFetchingGenesSimilaritiesSlice.reducer,
});

// Export actions.
export const { fetchSucceeded: genesSimilaritiesFetchSucceeded } = genesSimilaritiesSlice.actions;
export const { started: genesSimilaritiesFetchStarted, ended: genesSimilaritiesFetchEnded } =
    isFetchingGenesSimilaritiesSlice.actions;
export const { selected: genesSimilaritiesQueryGeneSelected, set: genesSimilaritiesQueryGeneSet } =
    queryGeneIdSlice.actions;
export const { distanceMeasureChanged: genesSimilaritiesDistanceMeasureChanged } =
    distanceMeasureSlice.actions;

export type GenesSimilaritiesState = ReturnType<typeof genesSimilaritiesReducer>;

export default genesSimilaritiesReducer;

// Selectors (exposes the store to containers).
export const getGenesSimilarities = (state: GenesSimilaritiesState): GeneSimilarity[] | null =>
    state.data;
export const getGenesSimilaritiesQueryGeneId = (state: GenesSimilaritiesState): string | null =>
    state.queryGeneId;
export const getIsFetchingGenesSimilarities = (state: GenesSimilaritiesState): boolean =>
    state.isFetchingGenesSimilarities;
export const getGenesSimilaritiesDistanceMeasure = (
    state: GenesSimilaritiesState,
): DistanceMeasure => state.distanceMeasure;
