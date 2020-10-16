import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import { SamplesExpressionsById } from '../models/internal';
import createIsFetchingSlice from './fetch';
import { timeSeriesSelected } from './timeSeries';

// State slices.
const samplesExpressionsByIdInitialState = {} as SamplesExpressionsById;
const samplesExpressionsByIdSlice = createSlice({
    name: 'samplesExpressions',
    initialState: samplesExpressionsByIdInitialState,
    reducers: {
        fetchSucceeded: (
            _state,
            action: PayloadAction<SamplesExpressionsById>,
        ): SamplesExpressionsById => {
            return action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(
            timeSeriesSelected,
            (): SamplesExpressionsById => {
                return samplesExpressionsByIdInitialState;
            },
        );
    },
});

const isFetchingSamplesExpressionsSlice = createIsFetchingSlice('samplesExpressions');

const samplesExpressionsReducer = combineReducers({
    byId: samplesExpressionsByIdSlice.reducer,
    isFetchingSamplesExpressions: isFetchingSamplesExpressionsSlice.reducer,
});

// Export actions.
export const {
    started: samplesExpressionsFetchStarted,
    ended: samplesExpressionsFetchEnded,
} = isFetchingSamplesExpressionsSlice.actions;

export const {
    fetchSucceeded: samplesExpressionsFetchSucceeded,
} = samplesExpressionsByIdSlice.actions;

export type SamplesExpressionsState = ReturnType<typeof samplesExpressionsReducer>;

export default samplesExpressionsReducer;

// Selectors (exposes the store to containers).
export const getIsFetchingSamplesExpressions = (state: SamplesExpressionsState): boolean =>
    state.isFetchingSamplesExpressions;

export const getSamplesExpressionsById = (state: SamplesExpressionsState): SamplesExpressionsById =>
    state.byId;

export const getSamplesExpressionsSamplesIds = createSelector(
    getSamplesExpressionsById,
    (samplesExpressionsById) => {
        return Object.keys(samplesExpressionsById);
    },
);
