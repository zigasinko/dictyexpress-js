import { createAction } from '@reduxjs/toolkit';
import { ofType, Epic } from 'redux-observable';
import { Storage, Data } from '@genialis/resolwe/dist/api/types/rest';
import { map, mergeMap, startWith, endWith, catchError, withLatestFrom } from 'rxjs/operators';
import { of, from, forkJoin } from 'rxjs';
import {
    getTimeSeriesSamplesIds,
    addToBasketStarted,
    addToBasketEnded,
    addSamplesToBasketSucceeded,
    fetchTimeSeries,
    timeSeriesSelected,
    timeSeriesFetchStarted,
    timeSeriesFetchEnded,
    timeSeriesFetchSucceeded,
    fetchTimeSeriesSamplesExpressions,
    getSelectedTimeSeries,
} from 'redux/stores/timeSeries';
import { RootState } from 'redux/rootReducer';
import { pushToSentryAndAddErrorSnackbar } from 'redux/stores/notifications';
import { SamplesExpressionsById, Gene } from 'redux/models/internal';
import { getStorageJson } from 'api/storageApi';
import {
    samplesExpressionsFetchSucceeded,
    samplesExpressionsFetchStarted,
    samplesExpressionsFetchEnded,
} from 'redux/stores/samplesExpressions';

import * as relationApi from '../../api/relationApi';
import * as basketApi from '../../api/basketApi';
import * as dataApi from '../../api/dataApi';

// Export epic actions.
export const selectGenes = createAction<Gene[]>('genes/selectGenes');
export const pasteGenesNames = createAction<string[]>('genes/pasteGenesNames');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const timeSeriesSelectedEpic: Epic<any, any, RootState, any> = (action$, state$) => {
    return action$.pipe(
        ofType(timeSeriesSelected),
        withLatestFrom(state$),
        mergeMap(([action, state]) => {
            // Add samples to (visualization) basket so that genes can be searched via autocomplete (/kb/feature/autocomplete api).
            const samplesIds = getTimeSeriesSamplesIds(action.payload, state.timeSeries);

            return from(basketApi.addToBasket(samplesIds)).pipe(
                map((response) => addSamplesToBasketSucceeded(response)),
                catchError((error) =>
                    of(
                        pushToSentryAndAddErrorSnackbar(
                            `Error adding time series samples to visualization basket.`,
                            error,
                        ),
                    ),
                ),
                startWith(addToBasketStarted()),
                endWith(addToBasketEnded()),
            );
        }),
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchTimeSeriesEpic: Epic<any, any, RootState, any> = (action$) => {
    return action$.pipe(
        ofType(fetchTimeSeries),
        mergeMap(() => {
            return from(relationApi.getTimeSeriesRelations()).pipe(
                map((response) => timeSeriesFetchSucceeded(response)),
                catchError((error) =>
                    of(pushToSentryAndAddErrorSnackbar(`Error retrieving time series.`, error)),
                ),
                startWith(timeSeriesFetchStarted()),
                endWith(timeSeriesFetchEnded()),
            );
        }),
    );
};

/**
 * Retrieve sample storage.
 * @param sampleData - Data to retrieve storage for (storage is defined in sampleData.output.exp_json).
 */
const getSampleStorage = async (
    sampleData: Data,
): Promise<{ sampleId: number; storage: Storage | null }> => {
    const storage = await getStorageJson(sampleData.output.exp_json);

    return {
        sampleId: sampleData.entity != null ? sampleData.entity.id : 0,
        storage,
    };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchTimeSeriesSamplesExpressionsEpic: Epic<any, any, RootState, any> = (
    action$,
    state$,
) => {
    return action$.pipe(
        ofType(fetchTimeSeriesSamplesExpressions),
        withLatestFrom(state$),
        mergeMap(([, state]) => {
            const timeSeriesSamplesExpressions = {} as SamplesExpressionsById;

            const selectedTimeSeriesId = getSelectedTimeSeries(state.timeSeries);

            const timeSeriesSamplesIds = getTimeSeriesSamplesIds(
                selectedTimeSeriesId.id,
                state.timeSeries,
            );

            return from(dataApi.getDataBySamplesIds(timeSeriesSamplesIds)).pipe(
                mergeMap((response) => {
                    // Once samples data is retrieved use it's output.exp_json to retrieve genes expressions.
                    return forkJoin(response.map(getSampleStorage)).pipe(
                        map((sampleStorages) => {
                            sampleStorages.forEach(({ sampleId, storage }) => {
                                if (storage != null) {
                                    timeSeriesSamplesExpressions[sampleId] = storage.json.genes;
                                }
                            });

                            return samplesExpressionsFetchSucceeded(timeSeriesSamplesExpressions);
                        }),
                        catchError((error) =>
                            of(
                                pushToSentryAndAddErrorSnackbar(
                                    `Error retrieving samples storage data.`,
                                    error,
                                ),
                            ),
                        ),
                    );
                }),
                catchError((error) =>
                    of(
                        pushToSentryAndAddErrorSnackbar(
                            `Error retrieving samples storage data.`,
                            error,
                        ),
                    ),
                ),
                startWith(samplesExpressionsFetchStarted()),
                endWith(samplesExpressionsFetchEnded()),
            );
        }),
    );
};
