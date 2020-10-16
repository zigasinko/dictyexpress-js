import { ofType, Epic, combineEpics } from 'redux-observable';
import { Storage, Data } from '@genialis/resolwe/dist/api/types/rest';
import { map, mergeMap, startWith, endWith, catchError, withLatestFrom } from 'rxjs/operators';
import { of, from, forkJoin, concat, EMPTY } from 'rxjs';
import {
    getTimeSeriesSamplesIds,
    addToBasketStarted,
    addToBasketEnded,
    addSamplesToBasketSucceeded,
    timeSeriesSelected,
    timeSeriesFetchStarted,
    timeSeriesFetchEnded,
    timeSeriesFetchSucceeded,
    getBasketId,
    getSelectedTimeSeries,
} from 'redux/stores/timeSeries';
import { RootState } from 'redux/rootReducer';
import { pushToSentryAndAddErrorSnackbar } from 'redux/stores/notifications';
import { SamplesExpressionsById } from 'redux/models/internal';
import {
    samplesExpressionsFetchSucceeded,
    samplesExpressionsFetchStarted,
    samplesExpressionsFetchEnded,
} from 'redux/stores/samplesExpressions';
import * as relationApi from 'api/relationApi';
import * as storageApi from 'api/storageApi';
import * as basketApi from 'api/basketApi';
import * as dataApi from 'api/dataApi';
import * as differentialExpressionApi from 'api/differentialExpressionApi';
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
    fetchTimeSeriesSamplesExpressions,
    fetchDifferentialExpressionsData,
    fetchTimeSeries,
    loginSucceeded,
    fetchSelectedDifferentialExpressionGenes,
} from './epicsActions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const timeSeriesSelectedEpic: Epic<any, any, RootState, any> = (action$, state$) => {
    return action$.pipe(
        ofType(timeSeriesSelected),
        withLatestFrom(state$),
        mergeMap(([action, state]) => {
            // Add samples to (visualization) basket so that genes can be searched via autocomplete (/kb/feature/autocomplete api).
            const samplesIds = getTimeSeriesSamplesIds(action.payload, state.timeSeries);

            return from(basketApi.addToBasket(samplesIds)).pipe(
                mergeMap((response) => {
                    return concat(
                        of(addSamplesToBasketSucceeded(response)),
                        /* of(fetchGaf()), */
                        of(fetchTimeSeriesSamplesExpressions()),
                        of(fetchDifferentialExpressionsData()),
                    );
                }),
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
const fetchTimeSeriesEpic: Epic<any, any, RootState, any> = (action$) => {
    return action$.pipe(
        ofType(fetchTimeSeries.toString(), loginSucceeded.toString()),
        mergeMap(() => {
            return from(relationApi.getTimeSeriesRelations()).pipe(
                map((response) => timeSeriesFetchSucceeded(response)),
                catchError((error) =>
                    of(pushToSentryAndAddErrorSnackbar(`Error retrieving time series. `, error)),
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
): Promise<{ sampleId: number; storage: Storage }> => {
    const storage = await storageApi.getStorageJson(sampleData.output.exp_json);

    return {
        sampleId: sampleData.entity != null ? sampleData.entity.id : 0,
        storage,
    };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchTimeSeriesSamplesExpressionsEpic: Epic<any, any, RootState, any> = (action$, state$) => {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchDifferentialExpressionsEpic: Epic<any, any, RootState, any> = (action$, state$) => {
    return action$.pipe(
        ofType(fetchDifferentialExpressionsData),
        withLatestFrom(state$),
        mergeMap(([, state]) => {
            const basketId = getBasketId(state.timeSeries);

            return from(differentialExpressionApi.getDifferentialExpressions(basketId)).pipe(
                map((differentialExpressions) => {
                    return differentialExpressionsFetchSucceeded(differentialExpressions);
                }),
                catchError((error) => {
                    return of(
                        pushToSentryAndAddErrorSnackbar(
                            `Error retrieving differential expressions.`,
                            error,
                        ),
                    );
                }),
                startWith(differentialExpressionsFetchStarted()),
                endWith(differentialExpressionsFetchEnded()),
            );
        }),
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchDifferentialExpressionsDataEpic: Epic<any, any, RootState, any> = (action$, state$) => {
    return action$.pipe(
        ofType(differentialExpressionSelected),
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

            return from(
                storageApi.getStorageJson(selectedDifferentialExpression.output.de_json),
            ).pipe(
                mergeMap((storage) => {
                    // Save differentialExpression module response json in redux store. Data will be extracted and displayed in
                    // differentialExpressions visualization component.
                    return concat(
                        of(differentialExpressionStorageFetchSucceeded(storage)),
                        of(fetchSelectedDifferentialExpressionGenes()),
                    );
                }),
                catchError((error) => {
                    return of(
                        pushToSentryAndAddErrorSnackbar(
                            `Error retrieving differential expressions storage data.`,
                            error,
                        ),
                    );
                }),
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
