import { ThunkAction, AnyAction } from '@reduxjs/toolkit';
import { Data as SampleData, Storage } from '@genialis/resolwe/dist/api/types/rest';
import {
    samplesExpressionsFetchSucceeded,
    samplesExpressionsFetchStarted,
    samplesExpressionsFetchEnded,
} from '../stores/samplesExpressions';
import { RootState } from '../rootReducer';
import * as relationApi from '../../api/relationApi';
import * as basketApi from '../../api/basketApi';
import * as dataApi from '../../api/dataApi';
import {
    timeSeriesFetchSucceeded,
    timeSeriesSelected,
    getTimeSeriesSamplesIds,
    addSamplesToBasketSucceeded,
    timeSeriesFetchStarted,
    timeSeriesFetchEnded,
    addToBasketStarted,
    addToBasketEnded,
    getSelectedTimeSeries,
} from '../stores/timeSeries';
import { getStorageJson } from '../../api/storageApi';
import { SamplesExpressionsById } from '../models/internal';
import { forwardToSentryAndNotifyUser } from '../../utils/errorUtils';

export const fetchTimeSeries = (): ThunkAction<void, RootState, unknown, AnyAction> => {
    return async (dispatch): Promise<void> => {
        dispatch(timeSeriesFetchStarted());
        try {
            const timeSeriesRelations = await relationApi.getTimeSeriesRelations();

            dispatch(timeSeriesFetchSucceeded(timeSeriesRelations));
        } catch (error) {
            forwardToSentryAndNotifyUser('Error retrieving time series.', error, dispatch);
        }

        dispatch(timeSeriesFetchEnded());
    };
};

/**
 * Retrieve sample storage.
 * @param sampleData - SampleData to retrieve storage for (storage is defined in sampleData.output.exp_json).
 */
const getSampleStorage = async (
    sampleData: SampleData,
): Promise<{ sampleId: number | null; storage: Storage | null }> => {
    const storage = await getStorageJson(sampleData.output.exp_json);
    return {
        sampleId: sampleData.entity != null ? sampleData.entity.id : null,
        storage,
    };
};

export const fetchTimeSeriesSamplesExpressions = (): ThunkAction<
    void,
    RootState,
    unknown,
    AnyAction
> => {
    return async (dispatch, getState): Promise<void> => {
        const timeSeriesSamplesExpressions = {} as SamplesExpressionsById;

        dispatch(samplesExpressionsFetchStarted());

        const selectedTimeSeriesId = getSelectedTimeSeries(getState().timeSeries);

        const timeSeriesSamplesIds = getTimeSeriesSamplesIds(
            selectedTimeSeriesId.id,
            getState().timeSeries,
        );

        // Fetch samples data (type: expression).
        try {
            const samplesDataArray = await dataApi.getDataBySamplesIds(timeSeriesSamplesIds);

            // Once samples data is retrieved use it's output.exp_json to retrieve genes expressions.
            const getSamplesStoragesPromises = samplesDataArray.map(getSampleStorage);

            const samplesStorages = await Promise.all(getSamplesStoragesPromises);
            samplesStorages.forEach(({ sampleId, storage }) => {
                if (storage != null && sampleId != null) {
                    timeSeriesSamplesExpressions[sampleId] = storage.json.genes;
                }
            });

            dispatch(samplesExpressionsFetchSucceeded(timeSeriesSamplesExpressions));
        } catch (error) {
            forwardToSentryAndNotifyUser('Error retrieving samples storage data.', error, dispatch);
        }

        dispatch(samplesExpressionsFetchEnded());
    };
};
export const selectTimeSeries = (id: number): ThunkAction<void, RootState, number, AnyAction> => {
    return async (dispatch, getState): Promise<void> => {
        dispatch(addToBasketStarted());
        // Add samples to (visualization) basket so that genes can be searched via autocomplete (/kb/feature/autocomplete api).
        const samplesIds = getTimeSeriesSamplesIds(id, getState().timeSeries);
        try {
            const basket = await basketApi.addToBasket(samplesIds);

            // Once samples are added to "visualization" basket, data for retrieving
            dispatch(timeSeriesSelected(id));
            dispatch(addSamplesToBasketSucceeded(basket));

            dispatch(fetchTimeSeriesSamplesExpressions());
        } catch (error) {
            forwardToSentryAndNotifyUser(
                'Error adding time series samples to visualization basket.',
                error,
                dispatch,
            );
        }

        dispatch(addToBasketEnded());
    };
};
