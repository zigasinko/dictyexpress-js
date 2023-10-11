import { DataStatus } from '@genialis/resolwe/dist/api/types/rest';
import { combineReducers, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DistanceMeasure, ClusteringLinkageFunction } from 'components/genexpress/common/constants';
import { MergedClusteringData } from 'redux/models/internal';
import { clearStateOnActions } from './common';
import createIsFetchingSlice from './fetch';
import { allGenesDeselected, geneDeselected, genesSelected } from './genes';
import { timeSeriesSelected } from './timeSeries';

const distanceMeasureInitialState = DistanceMeasure.euclidean;
const distanceMeasureSlice = createSlice({
    name: 'clustering',
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

const linkageFunctionInitialState = ClusteringLinkageFunction.average;
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

const clusteringStatusInitialState = null as DataStatus | null;
const clusteringStatusSlice = createSlice({
    name: 'clustering',
    initialState: clusteringStatusInitialState,
    reducers: {
        updated: (_state, action: PayloadAction<DataStatus | null>) => {
            return action.payload;
        },
    },
});

const mergedClusteringDataInitialState = null as MergedClusteringData | null;
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
        clearStateOnActions(
            builder,
            [
                timeSeriesSelected,
                allGenesDeselected,
                geneDeselected,
                genesSelected,
                linkageFunctionSlice.actions.linkageFunctionChanged,
                distanceMeasureSlice.actions.distanceMeasureChanged,
            ],
            mergedClusteringDataInitialState,
        );
    },
});

const isFetchingClusteringDataSlice = createIsFetchingSlice('clustering');

const clusteringReducer = combineReducers({
    mergedData: mergedClusteringDataSlice.reducer,
    status: clusteringStatusSlice.reducer,
    distanceMeasure: distanceMeasureSlice.reducer,
    linkageFunction: linkageFunctionSlice.reducer,
    isFetchingClusteringData: isFetchingClusteringDataSlice.reducer,
});

export const { started: clusteringDataFetchStarted, ended: clusteringDataFetchEnded } =
    isFetchingClusteringDataSlice.actions;

export const { distanceMeasureChanged: clusteringDistanceMeasureChanged } =
    distanceMeasureSlice.actions;
export const { linkageFunctionChanged: clusteringLinkageFunctionChanged } =
    linkageFunctionSlice.actions;

export const { fetchSucceeded: mergedClusteringDataFetchSucceeded } =
    mergedClusteringDataSlice.actions;

export const { updated: clusteringStatusUpdated } = clusteringStatusSlice.actions;

export type ClusteringState = ReturnType<typeof clusteringReducer>;

export default clusteringReducer;

export const getIsFetchingClusteringData = (state: ClusteringState): boolean =>
    state.isFetchingClusteringData;
export const getMergedClusteringData = (state: ClusteringState): MergedClusteringData | null =>
    state.mergedData;
export const getClusteringDistanceMeasure = (state: ClusteringState): DistanceMeasure =>
    state.distanceMeasure;
export const getClusteringLinkageFunction = (state: ClusteringState): ClusteringLinkageFunction =>
    state.linkageFunction;
export const getClusteringStatus = (state: ClusteringState) => state.status;
