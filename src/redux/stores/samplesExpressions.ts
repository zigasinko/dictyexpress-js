import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import { SamplesExpressionsById } from '../models/internal';
import createIsFetchingSlice from './fetch';

// State slices.
const samplesExpressionsInitialState = {} as SamplesExpressionsById;
const samplesExpressionsSlice = createSlice({
    name: 'samplesExpressions',
    initialState: samplesExpressionsInitialState,
    reducers: {
        fetchSucceeded: (
            _state,
            action: PayloadAction<SamplesExpressionsById>,
        ): SamplesExpressionsById => {
            return { ...action.payload };
        },
    },
});

const isFetchingSamplesExpressionsSlice = createIsFetchingSlice('samplesExpressions');

const samplesExpressionsReducer = combineReducers({
    byId: samplesExpressionsSlice.reducer,
    isFetchingSamplesExpressions: isFetchingSamplesExpressionsSlice.reducer,
});

// Export actions.
export const {
    started: samplesExpressionsFetchStarted,
    ended: samplesExpressionsFetchEnded,
} = isFetchingSamplesExpressionsSlice.actions;

export const { fetchSucceeded: samplesExpressionsFetchSucceeded } = samplesExpressionsSlice.actions;

export type SamplesExpressionsState = ReturnType<typeof samplesExpressionsReducer>;

export default samplesExpressionsReducer;

// Selectors (exposes the store to containers).
export const getSamplesExpressionsIsFetching = (state: SamplesExpressionsState): boolean =>
    state.isFetchingSamplesExpressions;

export const getSamplesExpressionsById = (state: SamplesExpressionsState): SamplesExpressionsById =>
    state.byId;

export const getSamplesExpressionsSamplesIds = createSelector(
    getSamplesExpressionsById,
    (samplesExpressionsById) => {
        return Object.keys(samplesExpressionsById);
    },
);
