import { Action, createAction } from '@reduxjs/toolkit';
import { ofType, Epic } from 'redux-observable';
import { Storage, Data } from '@genialis/resolwe/dist/api/types/rest';
import { map, mergeMap, startWith, endWith, catchError, withLatestFrom } from 'rxjs/operators';
import { of, from, forkJoin, concat } from 'rxjs';
import {
    getTimeSeriesSamplesIds,
    addToBasketStarted,
    addToBasketEnded,
    addSamplesToBasketSucceeded,
    timeSeriesSelected,
    timeSeriesFetchStarted,
    timeSeriesFetchEnded,
    timeSeriesFetchSucceeded,
    getSelectedTimeSeries,
} from 'redux/stores/timeSeries';
import { RootState } from 'redux/rootReducer';
import { SamplesExpressionsById, Gene } from 'redux/models/internal';
import storageApi from 'api/storageApi';
import {
    samplesExpressionsFetchSucceeded,
    samplesExpressionsFetchStarted,
    samplesExpressionsFetchEnded,
} from 'redux/stores/samplesExpressions';
import { handleError } from 'utils/errorUtils';
import relationApi from 'api/relationApi';
import basketApi from 'api/basketApi';
import dataApi from 'api/dataApi';
import { loginSucceeded } from './authenticationEpics';

// Export epic actions.
export const selectGenes = createAction<Gene[]>('genes/selectGenes');
export const pasteGenesNames = createAction<string[]>('genes/pasteGenesNames');
export const fetchTimeSeries = createAction('timeSeries/fetchTimeSeries');
export const fetchTimeSeriesSamplesExpressions = createAction(
    'timeSeries/fetchTimeSeriesSamplesExpressions',
);

export const timeSeriesSelectedEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return action$.pipe(
        ofType<Action, ReturnType<typeof timeSeriesSelected>>(timeSeriesSelected.toString()),
        withLatestFrom(state$),
        mergeMap(([, state]) => {
            // Add samples to (visualization) basket so that genes can be searched via autocomplete (/kb/feature/autocomplete api).
            const samplesIds = getSelectedTimeSeriesSamplesIds(state.timeSeries);

            return from(basketApi.addToBasket(samplesIds)).pipe(
                mergeMap((response) => {
                    return concat(
                        of(addSamplesToBasketSucceeded(response)),
                        of(fetchTimeSeriesSamplesExpressions()),
                    );
                }),
                catchError((error) =>
                    of(
                        handleError(
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

export const fetchTimeSeriesEpic: Epic<Action, Action, RootState> = (action$) => {
    return action$.pipe(
        ofType(fetchTimeSeries.toString(), loginSucceeded.toString()),
        mergeMap(() => {
            return from(relationApi.getTimeSeriesRelations()).pipe(
                map((response) => timeSeriesFetchSucceeded(response)),
                catchError((error) => of(handleError(`Error retrieving time series.`, error))),
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
): Promise<{ sampleId: number; storage: Storage }> => {
    const storage = await storageApi.getStorageJson(sampleData.output.exp_json);

    return {
        sampleId: sampleData.entity != null ? sampleData.entity.id : 0,
        storage,
    };
};

export const fetchTimeSeriesSamplesExpressionsEpic: Epic<Action, Action, RootState> = (
    action$,
    state$,
) => {
    return action$.pipe(
        ofType(fetchTimeSeriesSamplesExpressions.toString()),
        withLatestFrom(state$),
        mergeMap(([, state]) => {
            const timeSeriesSamplesExpressions = {} as SamplesExpressionsById;

            const timeSeriesSamplesIds = getSelectedTimeSeriesSamplesIds(state.timeSeries);

            return from(dataApi.getDataBySamplesIds(timeSeriesSamplesIds)).pipe(
                mergeMap((sampleData) => {
                    // Once samples data is retrieved use it's output.exp_json to retrieve genes expressions.
                    return forkJoin(sampleData.map(getSampleStorage)).pipe(
                        map((sampleStorages) => {
                            sampleStorages.forEach(({ sampleId, storage }) => {
                                if (storage != null) {
                                    timeSeriesSamplesExpressions[sampleId] = storage.json.genes;
                                }
                            });

                            return samplesExpressionsFetchSucceeded(timeSeriesSamplesExpressions);
                        }),
                        catchError((error) =>
                            of(handleError(`Error retrieving samples storage data.`, error)),
                        ),
                    );
                }),
                catchError((error) =>
                    of(handleError(`Error retrieving samples storage data.`, error)),
                ),
                startWith(samplesExpressionsFetchStarted()),
                endWith(samplesExpressionsFetchEnded()),
            );
        }),
    );
};
