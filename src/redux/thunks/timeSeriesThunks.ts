import { ThunkAction, AnyAction } from '@reduxjs/toolkit';
import { RootState } from '../rootReducer';
import * as relationApi from '../../api/relationApi';
import * as basketApi from '../../api/basketApi';
import {
    timeSeriesFetchSucceeded,
    timeSeriesSelected,
    getTimeSeriesSamplesIds,
    addSamplesToBasketSucceeded,
    timeSeriesFetchStarted,
    timeSeriesFetchEnded,
    addToBasketStarted,
    addToBasketEnded,
} from '../stores/timeSeries';

export const fetchTimeSeries = (): ThunkAction<void, RootState, unknown, AnyAction> => {
    return async (dispatch): Promise<void> => {
        dispatch(timeSeriesFetchStarted());
        const timeSeriesRelations = await relationApi.getTimeSeriesRelations();

        if (timeSeriesRelations != null) {
            dispatch(timeSeriesFetchSucceeded(timeSeriesRelations));
        }
        dispatch(timeSeriesFetchEnded());
    };
};

export const selectTimeSeries = (
    id: number,
): ThunkAction<void, RootState, number | string, AnyAction> => {
    return async (dispatch, getState): Promise<void> => {
        dispatch(addToBasketStarted());
        // Add samples to (visualization) basket so that genes can be searched via autocomplete (/kb/feature/autocomplete api).
        const samplesIds = getTimeSeriesSamplesIds(id, getState().timeSeries);
        const basket = await basketApi.addToBasket(samplesIds);

        if (basket != null) {
            // Once samples are added to "visualization" basket, data for retrieving
            dispatch(timeSeriesSelected(id));
            dispatch(addSamplesToBasketSucceeded(basket));
        }

        dispatch(addToBasketEnded());
    };
};
