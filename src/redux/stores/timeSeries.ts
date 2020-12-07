import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import _ from 'lodash';
import { Relation } from '@genialis/resolwe/dist/api/types/rest';
import { BasketAddSamplesResponse } from 'redux/models/rest';
import createIsFetchingSlice from './fetch';
import { RelationsById, BasketInfo } from '../models/internal';

// State slices.
const timeSeriesByIdInitialState = {} as RelationsById;
const timeSeriesByIdSlice = createSlice({
    name: 'timeSeries',
    initialState: timeSeriesByIdInitialState,
    reducers: {
        fetchSucceeded: (_state, action: PayloadAction<Relation[]>): RelationsById => {
            return _.keyBy(action.payload, 'id');
        },
    },
});

const selectedIdInitialState = null;
const selectedIdSlice = createSlice({
    name: 'timeSeries',
    initialState: selectedIdInitialState as number | null,
    reducers: {
        selected: (_state, action: PayloadAction<number>): number => action.payload,
    },
});

const initialBasketInfoState = {} as BasketInfo;
const basketInfoSlice = createSlice({
    name: 'timeSeries',
    initialState: initialBasketInfoState,
    reducers: {
        addSamplesToBasketSucceeded: (
            _state,
            action: PayloadAction<BasketAddSamplesResponse>,
        ): BasketInfo => {
            return {
                id: action.payload.id,
                source: action.payload.permitted_sources[0],
                species: action.payload.permitted_organisms[0],
                type: 'gene',
            };
        },
    },
});

const isFetchingSlice = createIsFetchingSlice('timeSeries');
const isAddingToBasketSlice = createIsFetchingSlice('basket');

const timeSeriesReducer = combineReducers({
    byId: timeSeriesByIdSlice.reducer,
    selectedId: selectedIdSlice.reducer,
    isFetching: isFetchingSlice.reducer,
    isAddingToBasket: isAddingToBasketSlice.reducer,
    basketInfo: basketInfoSlice.reducer,
});

// Export actions.
export const { selected: timeSeriesSelected } = selectedIdSlice.actions;
export const { fetchSucceeded: timeSeriesFetchSucceeded } = timeSeriesByIdSlice.actions;
export const { addSamplesToBasketSucceeded } = basketInfoSlice.actions;
export const {
    started: timeSeriesFetchStarted,
    ended: timeSeriesFetchEnded,
} = isFetchingSlice.actions;
export const {
    started: addToBasketStarted,
    ended: addToBasketEnded,
} = isAddingToBasketSlice.actions;
export type TimeSeriesState = ReturnType<typeof timeSeriesReducer>;

export default timeSeriesReducer;

// Selectors (expose the store to containers).
const getTimeSeriesById = (state: TimeSeriesState): RelationsById => state.byId;
const getSelectedTimeSeriesId = (state: TimeSeriesState): number => state.selectedId ?? 0;

export const getTimeSeriesIsFetching = (state: TimeSeriesState): boolean => state.isFetching;
export const getIsAddingToBasket = (state: TimeSeriesState): boolean => state.isAddingToBasket;

// createSelector function uses memoization so that only if byId slice changes it will get recomputed again.
export const getTimeSeries = createSelector(getTimeSeriesById, (timeSeriesById): Relation[] => {
    return Object.keys(timeSeriesById).map(
        (timeSeriesLabel) => timeSeriesById[parseInt(timeSeriesLabel, 10)],
    );
});

export const getSelectedTimeSeries = createSelector(
    getTimeSeriesById,
    getSelectedTimeSeriesId,
    (timeSeriesById, selectedId) => {
        return timeSeriesById[selectedId];
    },
);

export const getBasketInfo = (state: TimeSeriesState): BasketInfo => state.basketInfo;
export const getBasketId = (state: TimeSeriesState): string => state.basketInfo.id;

export const getSelectedTimeSeriesLabels = createSelector(
    getSelectedTimeSeries,
    (selectedTimeSeries) => {
        return _.uniq(
            _.compact(selectedTimeSeries?.partitions?.map((partition) => partition.label)),
        );
    },
);

export const getSelectedTimeSeriesSamplesIds = createSelector(
    getSelectedTimeSeries,
    (selectedTimeSeries) => {
        return selectedTimeSeries.partitions.map((partition) => partition.entity);
    },
);
