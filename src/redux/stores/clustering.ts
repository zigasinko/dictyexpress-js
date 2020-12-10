import { combineReducers, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MergedClusteringData } from 'redux/models/internal';
import { ClusteringDistanceMeasure, ClusteringLinkageFunction } from 'redux/models/rest';
import createIsFetchingSlice from './fetch';
import { allGenesDeselected, geneDeselected, genesSelected } from './genes';
import { timeSeriesSelected } from './timeSeries';

// State slices.
const mergedClusteringDataInitialState = {} as MergedClusteringData;
const mergedClusteringDataSlice = createSlice({
    name: 'clustering',
    initialState: mergedClusteringDataInitialState,
    reducers: {
        fetchSucceeded: (
            _state,
            action: PayloadAction<MergedClusteringData>,
        ): MergedClusteringData => {
            return action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(
            timeSeriesSelected,
            (): MergedClusteringData => {
                return mergedClusteringDataInitialState;
            },
        );
        builder.addCase(
            allGenesDeselected,
            (): MergedClusteringData => {
                return mergedClusteringDataInitialState;
            },
        );
        builder.addCase(
            geneDeselected,
            (): MergedClusteringData => {
                return mergedClusteringDataInitialState;
            },
        );
        builder.addCase(
            genesSelected,
            (): MergedClusteringData => {
                return mergedClusteringDataInitialState;
            },
        );
    },
});

const distanceMeasureInitialState = 'spearman' as ClusteringDistanceMeasure;
const distanceMeasureSlice = createSlice({
    name: 'clustering',
    initialState: distanceMeasureInitialState,
    reducers: {
        distanceMeasureChanged: (
            _state,
            action: PayloadAction<ClusteringDistanceMeasure>,
        ): ClusteringDistanceMeasure => {
            return action.payload;
        },
    },
});

const linkageFunctionInitialState = 'average' as ClusteringLinkageFunction;
const linkageFunctionSlice = createSlice({
    name: 'clustering',
    initialState: linkageFunctionInitialState,
    reducers: {
        linkageFunctionChanged: (
            _state,
            action: PayloadAction<ClusteringLinkageFunction>,
        ): ClusteringLinkageFunction => {
            return action.payload;
        },
    },
});

const isFetchingClusteringDataSlice = createIsFetchingSlice('clustering');

const clusteringReducer = combineReducers({
    mergedData: mergedClusteringDataSlice.reducer,
    distanceMeasure: distanceMeasureSlice.reducer,
    linkageFunction: linkageFunctionSlice.reducer,
    isFetchingClusteringData: isFetchingClusteringDataSlice.reducer,
});

// Export actions.
export const {
    started: clusteringDataFetchStarted,
    ended: clusteringDataFetchEnded,
} = isFetchingClusteringDataSlice.actions;

export const { distanceMeasureChanged } = distanceMeasureSlice.actions;
export const { linkageFunctionChanged } = linkageFunctionSlice.actions;

export const {
    fetchSucceeded: mergedClusteringDataFetchSucceeded,
} = mergedClusteringDataSlice.actions;

export type ClusteringState = ReturnType<typeof clusteringReducer>;

export default clusteringReducer;

// Selectors (exposes the store to containers).
export const getIsFetchingClusteringData = (state: ClusteringState): boolean =>
    state.isFetchingClusteringData;
export const getMergedClusteringData = (state: ClusteringState): MergedClusteringData =>
    state.mergedData;
export const getDistanceMeasure = (state: ClusteringState): ClusteringDistanceMeasure =>
    state.distanceMeasure;
export const getLinkageFunction = (state: ClusteringState): ClusteringLinkageFunction =>
    state.linkageFunction;
