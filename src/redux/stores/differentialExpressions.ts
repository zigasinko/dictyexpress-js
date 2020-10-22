import { Storage } from '@genialis/resolwe/dist/api/types/rest';
import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';
import { combineReducers } from 'redux';
import { DifferentialExpression, DifferentialExpressionsById } from '../models/internal';
import createIsFetchingSlice from './fetch';
import { timeSeriesSelected } from './timeSeries';

// State slices.
const differentialExpressionsByIdInitialState = {} as DifferentialExpressionsById;
const differentialExpressionsByIdSlice = createSlice({
    name: 'differentialExpressions',
    initialState: differentialExpressionsByIdInitialState,
    reducers: {
        fetchSucceeded: (
            _state,
            action: PayloadAction<DifferentialExpression[]>,
        ): DifferentialExpressionsById => {
            return _.keyBy(action.payload, (differentialExpression) =>
                differentialExpression.id.toString(),
            );
        },
        storageFetchSucceeded: (
            state,
            action: PayloadAction<Storage>,
        ): DifferentialExpressionsById => {
            // Get all differential expressions with the same output json that was fetched
            // and fill their json property.
            // TODO: can this be prettier?
            const differentialExpressions = _.flatMap(state);
            const storageDifferentialExpressions = differentialExpressions.filter(
                (differentialExpression) =>
                    differentialExpression.output.de_json === action.payload.id,
            );
            return _.keyBy(
                storageDifferentialExpressions.map((differentialExpression) => ({
                    ...differentialExpression,
                    json: action.payload.json,
                })),
                'id',
            );
        },
    },
    extraReducers: (builder) => {
        builder.addCase(
            timeSeriesSelected,
            (): DifferentialExpressionsById => {
                return differentialExpressionsByIdInitialState;
            },
        );
    },
});

const selectedIdSlice = createSlice({
    name: 'differentialExpressions',
    initialState: 0,
    reducers: {
        selected: (_state, action: PayloadAction<number>): number => action.payload,
    },
});

const isFetchingDifferentialExpressionsSlice = createIsFetchingSlice('differentialExpressions');
const isFetchingDifferentialExpressionsDataSlice = createIsFetchingSlice(
    'differentialExpressionsData',
);

const differentialExpressionsReducer = combineReducers({
    byId: differentialExpressionsByIdSlice.reducer,
    selectedId: selectedIdSlice.reducer,
    isFetchingDifferentialExpressions: isFetchingDifferentialExpressionsSlice.reducer,
    isFetchingDifferentialExpressionsData: isFetchingDifferentialExpressionsDataSlice.reducer,
});

// Export actions.
export const {
    started: differentialExpressionsFetchStarted,
    ended: differentialExpressionsFetchEnded,
} = isFetchingDifferentialExpressionsSlice.actions;

export const { selected: differentialExpressionSelected } = selectedIdSlice.actions;

export const {
    started: differentialExpressionsDataFetchStarted,
    ended: differentialExpressionsDataFetchEnded,
} = isFetchingDifferentialExpressionsDataSlice.actions;

export const {
    fetchSucceeded: differentialExpressionsFetchSucceeded,
    storageFetchSucceeded: differentialExpressionStorageFetchSucceeded,
} = differentialExpressionsByIdSlice.actions;

export type DifferentialExpressionsState = ReturnType<typeof differentialExpressionsReducer>;

export default differentialExpressionsReducer;

// Selectors (exposes the store to containers).
const getSelectedDifferentialExpressionId = (state: DifferentialExpressionsState): number =>
    state.selectedId;

export const getIsFetchingDifferentialExpressions = (
    state: DifferentialExpressionsState,
): boolean => state.isFetchingDifferentialExpressions;

export const getIsFetchingDifferentialExpressionsData = (
    state: DifferentialExpressionsState,
): boolean => state.isFetchingDifferentialExpressionsData;

export const getDifferentialExpressionsById = (
    state: DifferentialExpressionsState,
): DifferentialExpressionsById => state.byId;

export const getDifferentialExpressions = createSelector(
    getDifferentialExpressionsById,
    (differentialExpressionsById): DifferentialExpression[] => {
        return _.flatMap(differentialExpressionsById);
    },
);

export const getDifferentialExpression = (
    differentialExpressionId: number,
    state: DifferentialExpressionsState,
): DifferentialExpression => state.byId[differentialExpressionId];

export const getSelectedDifferentialExpression = createSelector(
    getDifferentialExpressionsById,
    getSelectedDifferentialExpressionId,
    (differentialExpressionsById, selectedId) => {
        return differentialExpressionsById[selectedId];
    },
);

export const getSelectedDifferentialExpressionGeneIds = createSelector(
    getSelectedDifferentialExpression,
    (selectedDifferentialExpression) => selectedDifferentialExpression.json.gene_id as string[],
);
