import { Action } from '@reduxjs/toolkit';
import { ofType, Epic, combineEpics } from 'redux-observable';
import { Storage, Data } from '@genialis/resolwe/dist/api/types/rest';
import { map, mergeMap, startWith, endWith, catchError, withLatestFrom } from 'rxjs/operators';
import { of, from, forkJoin, EMPTY, merge } from 'rxjs';
import {
    getSelectedTimeSeriesSamplesIds,
    addToBasketStarted,
    addToBasketEnded,
    addSamplesToBasketSucceeded,
    timeSeriesSelected,
    timeSeriesFetchStarted,
    timeSeriesFetchEnded,
    timeSeriesFetchSucceeded,
    getBasketId,
} from 'redux/stores/timeSeries';
import { RootState } from 'redux/rootReducer';
import { SamplesExpressionsById } from 'redux/models/internal';
import {
    samplesExpressionsFetchSucceeded,
    samplesExpressionsFetchStarted,
    samplesExpressionsFetchEnded,
} from 'redux/stores/samplesExpressions';
import { handleError } from 'utils/errorUtils';
import {
    differentialExpressionsDataFetchEnded,
    differentialExpressionsDataFetchStarted,
    differentialExpressionSelected,
    differentialExpressionsFetchEnded,
    differentialExpressionsFetchStarted,
    differentialExpressionsFetchSucceeded,
    differentialExpressionStorageFetchSucceeded,
    getDifferentialExpression,
} from 'redux/stores/differentialExpressions';
import {
    addToBasket,
    getDataBySamplesIds,
    getDifferentialExpressions,
    getTimeSeriesRelations,
    getStorage,
} from 'api';
import {
    fetchTimeSeriesSamplesExpressions,
    fetchDifferentialExpressionsData,
    fetchTimeSeries,
    loginSucceeded,
    fetchSelectedDifferentialExpressionGenes,
} from './epicsActions';

const fetchTimeSeriesEpic: Epic<Action, Action, RootState> = (action$) => {
    return action$.pipe(
        ofType(fetchTimeSeries.toString(), loginSucceeded.toString()),
        mergeMap(() => {
            return from(getTimeSeriesRelations()).pipe(
                map((response) => timeSeriesFetchSucceeded(response)),
                catchError((error) => of(handleError(`Error retrieving time series.`, error))),
                startWith(timeSeriesFetchStarted()),
                endWith(timeSeriesFetchEnded()),
            );
        }),
    );
};

const timeSeriesSelectedEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return action$.pipe(
        ofType<Action, ReturnType<typeof timeSeriesSelected>>(timeSeriesSelected.toString()),
        withLatestFrom(state$),
        mergeMap(([, state]) => {
            // Add samples to (visualization) basket so that genes can be searched via autocomplete (/kb/feature/autocomplete api).
            const samplesIds = getSelectedTimeSeriesSamplesIds(state.timeSeries);

            return from(addToBasket(samplesIds)).pipe(
                mergeMap((response) => {
                    return merge(
                        of(addSamplesToBasketSucceeded(response)),
                        of(fetchTimeSeriesSamplesExpressions()),
                        of(fetchDifferentialExpressionsData()),
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

/**
 * Retrieve sample storage.
 * @param sampleData - Data to retrieve storage for (storage is defined in sampleData.output.exp_json).
 */
const getSampleStorage = async (
    sampleData: Data,
): Promise<{ sampleId: number; storage: Storage }> => {
    const storage = await getStorage(sampleData.output.exp_json);

    return {
        sampleId: sampleData.entity != null ? sampleData.entity.id : 0,
        storage,
    };
};

const fetchTimeSeriesSamplesExpressionsEpic: Epic<Action, Action, RootState> = (
    action$,
    state$,
) => {
    return action$.pipe(
        ofType(fetchTimeSeriesSamplesExpressions.toString()),
        withLatestFrom(state$),
        mergeMap(([, state]) => {
            const timeSeriesSamplesExpressions = {} as SamplesExpressionsById;
            const timeSeriesSamplesIds = getSelectedTimeSeriesSamplesIds(state.timeSeries);

            return from(getDataBySamplesIds(timeSeriesSamplesIds)).pipe(
                mergeMap((sampleData) => {
                    // Once samples data is retrieved use it's output.exp_json to retrieve genes expressions.
                    return forkJoin(sampleData.map(getSampleStorage)).pipe(
                        map((sampleStorages) => {
                            sampleStorages.forEach(({ sampleId, storage }) => {
                                timeSeriesSamplesExpressions[sampleId] = storage.json.genes;
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

const fetchDifferentialExpressionsEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return action$.pipe(
        ofType(fetchDifferentialExpressionsData),
        withLatestFrom(state$),
        mergeMap(([, state]) => {
            const basketId = getBasketId(state.timeSeries);

            return from(getDifferentialExpressions(basketId)).pipe(
                map((differentialExpressions) => {
                    return differentialExpressionsFetchSucceeded(differentialExpressions);
                }),
                catchError((error) =>
                    of(handleError(`Error retrieving differential expressions.`, error)),
                ),
                startWith(differentialExpressionsFetchStarted()),
                endWith(differentialExpressionsFetchEnded()),
            );
        }),
    );
};

const fetchDifferentialExpressionsDataEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return action$.pipe(
        ofType<Action, ReturnType<typeof differentialExpressionSelected>>(
            differentialExpressionSelected.toString(),
        ),
        withLatestFrom(state$),
        mergeMap(([action, state]) => {
            const selectedDifferentialExpression = getDifferentialExpression(
                action.payload,
                state.differentialExpressions,
            );

            // If we already fetched differentialExpression storage json, there's no need to fetch it again!
            if (selectedDifferentialExpression.json != null) {
                return EMPTY;
            }

            return from(getStorage(selectedDifferentialExpression.output.de_json)).pipe(
                mergeMap((storage) => {
                    // Save differentialExpression module response json in redux store. Data will be extracted and displayed in
                    // differentialExpressions visualization component.
                    return merge(
                        of(differentialExpressionStorageFetchSucceeded(storage)),
                        of(fetchSelectedDifferentialExpressionGenes()),
                    );
                }),
                catchError((error) =>
                    of(
                        handleError(
                            `Error retrieving differential expressions storage data.`,
                            error,
                        ),
                    ),
                ),
                startWith(differentialExpressionsDataFetchStarted()),
                endWith(differentialExpressionsDataFetchEnded()),
            );
        }),
    );
};

export default combineEpics(
    timeSeriesSelectedEpic,
    fetchTimeSeriesEpic,
    fetchTimeSeriesSamplesExpressionsEpic,
    fetchDifferentialExpressionsEpic,
    fetchDifferentialExpressionsDataEpic,
);
