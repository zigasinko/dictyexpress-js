import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import _ from 'lodash';
import { Relation } from '@genialis/resolwe/dist/api/types/rest';
import { BasketAddSamplesResponse } from '../models/rest';
import createIsFetchingSlice from './fetch';
import { RelationsById, SamplesInfo } from '../models/internal';

// State slices.
const timeSeriesByIdInitialState = {} as RelationsById;
const timeSeriesByIdSlice = createSlice({
    name: 'timeSeries',
    initialState: timeSeriesByIdInitialState,
    reducers: {
        fetchSucceeded: (_state, action: PayloadAction<Relation[]>): RelationsById => {
            return _.keyBy(action.payload, (relation) => relation.id.toString());
        },
    },
});

const selectedIdSlice = createSlice({
    name: 'timeSeries',
    initialState: 0,
    reducers: {
        selected: (_state, action: PayloadAction<number>): number => action.payload,
    },
});

const initialSamplesInfoState = {} as SamplesInfo;
const samplesInfoSlice = createSlice({
    name: 'timeSeries',
    initialState: initialSamplesInfoState,
    reducers: {
        addSamplesToBasketSucceeded: (
            _state,
            action: PayloadAction<BasketAddSamplesResponse>,
        ): SamplesInfo => {
            return {
                source: action.payload.permitted_sources[0],
                species: action.payload.permitted_organisms[0],
                type: 'gene',
            };
        },
    },
});

const isFetchingSlice = createIsFetchingSlice('timeSeries');
const isAddingToBasket = createIsFetchingSlice('basket');

const timeSeriesReducer = combineReducers({
    byId: timeSeriesByIdSlice.reducer,
    selectedId: selectedIdSlice.reducer,
    isFetching: isFetchingSlice.reducer,
    isAddingToBasket: isAddingToBasket.reducer,
    selectedSamplesInfo: samplesInfoSlice.reducer,
});

// Export actions.
export const { selected: timeSeriesSelected } = selectedIdSlice.actions;
export const { fetchSucceeded: timeSeriesFetchSucceeded } = timeSeriesByIdSlice.actions;
export const { addSamplesToBasketSucceeded } = samplesInfoSlice.actions;
export const {
    started: timeSeriesFetchStarted,
    ended: timeSeriesFetchEnded,
} = isFetchingSlice.actions;
export const { started: addToBasketStarted, ended: addToBasketEnded } = isAddingToBasket.actions;
export type TimeSeriesState = ReturnType<typeof timeSeriesReducer>;

export default timeSeriesReducer;

// Selectors (expose the store to containers).
const getTimeSeriesById = (state: TimeSeriesState): RelationsById => state.byId;
const getSelectedTimeSeriesId = (state: TimeSeriesState): number => state.selectedId;

export const getTimeSeriesIsFetching = (state: TimeSeriesState): boolean => state.isFetching;

// createSelector function uses memoization so that only if byId slice changes it will get recomputed again.
export const getTimeSeries = createSelector(getTimeSeriesById, (timeSeriesById) => {
    return Object.keys(timeSeriesById).map((timeSeriesLabel) => timeSeriesById[timeSeriesLabel]);
});

export const getTimeSeriesSamplesIds = (timeSeriesId: number, state: TimeSeriesState): number[] =>
    state.byId[timeSeriesId].partitions.map((partition) => partition.entity);

export const getSelectedTimeSeries = createSelector(
    getTimeSeriesById,
    getSelectedTimeSeriesId,
    (timeSeriesById, selectedId) => {
        return timeSeriesById[selectedId];
    },
);

export const getSelectedSamplesInfo = (state: TimeSeriesState): SamplesInfo =>
    state.selectedSamplesInfo;

export const getSelectedTimeSeriesLabels = createSelector(
    getSelectedTimeSeries,
    (selectedTimeSeries) => {
        return _.uniq(
            _.compact(selectedTimeSeries?.partitions?.map((partition) => partition.label)),
        );
    },
);
