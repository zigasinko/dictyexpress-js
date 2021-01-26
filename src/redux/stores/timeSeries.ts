import { createSlice, PayloadAction, createSelector, combineReducers } from '@reduxjs/toolkit';
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
        selected: (_state, action: PayloadAction<number>): number => {
            return action.payload;
        },
    },
});

const comparisonIdsIdInitialState = [] as number[];
const comparisonIdsSlice = createSlice({
    name: 'comparisonTimeSeries',
    initialState: comparisonIdsIdInitialState,
    reducers: {
        changed: (_state, action: PayloadAction<number[]>): number[] => action.payload,
    },
});

const basketInfoInitialState = {} as BasketInfo | null;
const basketInfoSlice = createSlice({
    name: 'timeSeries',
    initialState: basketInfoInitialState,
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
    extraReducers: (builder) => {
        builder.addCase(selectedIdSlice.actions.selected, (): BasketInfo | null => {
            return basketInfoInitialState;
        });
    },
});

const basketExpressionsIdsInitialState = [] as number[];
const basketExpressionsIdsSlice = createSlice({
    name: 'timeSeries',
    initialState: basketExpressionsIdsInitialState,
    reducers: {
        fetchBasketExpressionsIdsSucceeded: (_state, action: PayloadAction<number[]>): number[] => {
            return action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(selectedIdSlice.actions.selected, (): number[] => {
            return basketExpressionsIdsInitialState;
        });
    },
});

const isFetchingSlice = createIsFetchingSlice('timeSeries');
const isAddingToBasketSlice = createIsFetchingSlice('basket');

const timeSeriesReducer = combineReducers({
    byId: timeSeriesByIdSlice.reducer,
    selectedId: selectedIdSlice.reducer,
    comparisonIds: comparisonIdsSlice.reducer,
    isFetching: isFetchingSlice.reducer,
    isAddingToBasket: isAddingToBasketSlice.reducer,
    basketInfo: basketInfoSlice.reducer,
    basketExpressionsIds: basketExpressionsIdsSlice.reducer,
});

// Export actions.
export const { selected: timeSeriesSelected } = selectedIdSlice.actions;
export const { changed: comparisonTimeSeriesChanged } = comparisonIdsSlice.actions;
export const { fetchSucceeded: timeSeriesFetchSucceeded } = timeSeriesByIdSlice.actions;
export const { addSamplesToBasketSucceeded } = basketInfoSlice.actions;
export const { fetchBasketExpressionsIdsSucceeded } = basketExpressionsIdsSlice.actions;
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
const getSelectedTimeSeriesId = (state: TimeSeriesState): number | null => state.selectedId;
const getComparisonTimeSeriesIds = (state: TimeSeriesState): number[] => state.comparisonIds ?? [];

export const getTimeSeriesIsFetching = (state: TimeSeriesState): boolean => state.isFetching;
export const getIsAddingToBasket = (state: TimeSeriesState): boolean => state.isAddingToBasket;
export const getBasketExpressionsIds = (state: TimeSeriesState): number[] =>
    state.basketExpressionsIds;

// createSelector function uses memoization so that only if byId slice changes it will get recomputed again.
export const getTimeSeries = createSelector(getTimeSeriesById, (timeSeriesById): Relation[] => {
    return Object.keys(timeSeriesById).map(
        (timeSeriesLabel) => timeSeriesById[parseInt(timeSeriesLabel, 10)],
    );
});

export const getSelectedTimeSeries = createSelector(
    getTimeSeriesById,
    getSelectedTimeSeriesId,
    (timeSeriesById, selectedId): Relation | null => {
        return selectedId != null ? timeSeriesById[selectedId] ?? null : null;
    },
);

export const getComparisonTimeSeries = createSelector(
    getTimeSeriesById,
    getComparisonTimeSeriesIds,
    (timeSeriesById, comparisonTimeSeriesIds) => {
        return comparisonTimeSeriesIds
            .map((timeSeriesId) => timeSeriesById[timeSeriesId] ?? null)
            .filter((timeSeries) => timeSeries != null);
    },
);

export const getBasketInfo = (state: TimeSeriesState): BasketInfo | null => state.basketInfo;
export const getBasketId = (state: TimeSeriesState): string | null => state.basketInfo?.id ?? null;

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
        return selectedTimeSeries?.partitions.map((partition) => partition.entity) ?? [];
    },
);

export const getComparisonTimeSeriesSamplesIds = createSelector(
    getComparisonTimeSeries,
    (comparisonTimeSeries) => {
        return comparisonTimeSeries.flatMap((timeSeries) =>
            timeSeries.partitions.map((partition) => partition.entity),
        );
    },
);
