import { createSlice, PayloadAction, createSelector, combineReducers } from '@reduxjs/toolkit';
import { SamplesGenesExpressionsById } from '../models/internal';
import createIsFetchingSlice from './fetch';
import { timeSeriesSelected } from './timeSeries';

// State slices.
const samplesExpressionsByIdInitialState = {} as SamplesGenesExpressionsById;
const samplesExpressionsByIdSlice = createSlice({
    name: 'samplesExpressions',
    initialState: samplesExpressionsByIdInitialState,
    reducers: {
        fetchSucceeded: (
            _state,
            action: PayloadAction<SamplesGenesExpressionsById>,
        ): SamplesGenesExpressionsById => {
            return action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(
            timeSeriesSelected,
            (): SamplesGenesExpressionsById => {
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

export const getSamplesExpressionsById = (
    state: SamplesExpressionsState,
): SamplesGenesExpressionsById => state.byId;

export const getSamplesExpressionsSamplesIds = createSelector(
    getSamplesExpressionsById,
    (samplesExpressionsById) => {
        return Object.keys(samplesExpressionsById);
    },
);
