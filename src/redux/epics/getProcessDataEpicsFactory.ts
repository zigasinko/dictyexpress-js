import { Epic, combineEpics, StateObservable } from 'redux-observable';
import {
    map,
    startWith,
    endWith,
    catchError,
    withLatestFrom,
    switchMap,
    mergeMap,
    filter,
} from 'rxjs/operators';
import { of, from, EMPTY, Observable, merge, isObservable } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import { handleError } from 'utils/errorUtils';
import { Action, ActionCreatorWithoutPayload, ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { DisposeFunction as QueryObserverDisposeFunction } from 'managers/queryObserverManager';
import {
    Data,
    DONE_DATA_STATUS,
    ERROR_DATA_STATUS,
    Storage,
} from '@genialis/resolwe/dist/api/types/rest';
import { ProcessInfo } from 'redux/models/internal';
import _ from 'lodash';
import { getDataReactive, getStorage, getOrCreateData } from 'api';
import { ProcessSlug } from 'components/genexpress/common/constants';

export const ProcessesInfo: { [_: string]: ProcessInfo } = {
    HierarchicalClustering: {
        name: 'Hierarchical clustering',
        slug: ProcessSlug.clustering,
    },
    GOEnrichment: {
        name: 'Gene Ontology Enrichment',
        slug: ProcessSlug.goEnrichment,
    },
    FindSimilarGenes: {
        name: 'Find Similar Genes',
        slug: ProcessSlug.findSimilar,
    },
};

/* If analysis isn't cached on the server, it's data will be pushed via WebSocket. So if any of parameters
 * change, we must unsubscribe previous queryObserver. This way we avoid race conditions.
 */
const activeQueryObserverDisposeFunction: { [_: string]: QueryObserverDisposeFunction } = {};

export type ProcessDataEpicsFactoryProps<DataType> = {
    processInfo: ProcessInfo;
    processParametersObservable: (
        action: Observable<Action>,
        state: StateObservable<RootState>,
    ) => Observable<Record<string, unknown> | Observable<ReturnType<typeof handleError>>>;
    fetchDataActionCreator: ActionCreatorWithPayload<number>;
    processStartedActionCreator: ActionCreatorWithoutPayload;
    processEndedActionCreator: ActionCreatorWithoutPayload;
    fetchDataSucceededActionCreator: ActionCreatorWithPayload<DataType>;
    getStorageIdFromData: (data: DataType) => number;
    actionFromStorageResponse: (storage: Storage, state: RootState) => Action;
};

const getProcessDataEpicsFactory = <DataType extends Data>({
    processInfo,
    processParametersObservable,
    fetchDataActionCreator,
    processStartedActionCreator,
    processEndedActionCreator,
    fetchDataSucceededActionCreator,
    getStorageIdFromData,
    actionFromStorageResponse,
}: ProcessDataEpicsFactoryProps<DataType>): Epic<Action, Action, RootState> => {
    const handleProcessEndedWithError = (message: string, error?: Error): Observable<Action> => {
        return merge(of(handleError(message, error)), of(processEndedActionCreator()));
    };

    const handleAnalysisDataResponse = (response: DataType): Observable<Action | never> => {
        if (response.status === ERROR_DATA_STATUS) {
            return handleProcessEndedWithError(
                `${processInfo.name} analysis ended with an error ${
                    response.process_error.length > 0 ? response.process_error[0] : ''
                }`,
            );
        }

        if (response.status === DONE_DATA_STATUS && getStorageIdFromData(response) != null) {
            return of(fetchDataSucceededActionCreator(response));
        }

        return EMPTY;
    };

    const getOrCreateEpic: Epic<Action, Action, RootState> = (action$, state$) => {
        return processParametersObservable(action$, state$).pipe(
            switchMap((input) => {
                // Cleanup queryObserverManager existing observer waiting to receive process
                // data via WebSocket.
                if (activeQueryObserverDisposeFunction[processInfo.name] != null) {
                    void activeQueryObserverDisposeFunction[processInfo.name]();
                    delete activeQueryObserverDisposeFunction[processInfo.name];
                }

                if (_.isEmpty(input)) {
                    return of(processEndedActionCreator());
                }

                if (isObservable(input)) {
                    return input;
                }

                return from(getOrCreateData(input, processInfo.slug)).pipe(
                    map((response) => fetchDataActionCreator(response.id)),
                    catchError((error) =>
                        handleProcessEndedWithError(
                            `Error creating ${processInfo.name.toLowerCase()} process.`,
                            error,
                        ),
                    ),
                    startWith(processStartedActionCreator()),
                );
            }),
        );
    };

    const fetchDataEpic: Epic<Action, Action, RootState> = (action$) => {
        return action$.pipe(
            filter(fetchDataActionCreator.match),
            switchMap((action) => {
                return from(getDataReactive(action.payload, handleAnalysisDataResponse)).pipe(
                    mergeMap((response) => {
                        activeQueryObserverDisposeFunction[processInfo.name] =
                            response.disposeFunction;
                        return handleAnalysisDataResponse(response.item);
                    }),
                    catchError((error) =>
                        handleProcessEndedWithError(
                            `${processInfo.name} analysis ended with an error.`,
                            error,
                        ),
                    ),
                );
            }),
        );
    };

    const fetchStorageEpic: Epic<Action, Action, RootState> = (action$, state$) => {
        return action$.pipe(
            filter(fetchDataSucceededActionCreator.match),
            withLatestFrom(state$),
            switchMap(([action, state]) => {
                return from(getStorage(getStorageIdFromData(action.payload))).pipe(
                    map((storage) => {
                        return actionFromStorageResponse(storage, state);
                    }),
                    catchError((error) =>
                        handleProcessEndedWithError(
                            `Error retrieving ${processInfo.name.toLowerCase()} storage.`,
                            error,
                        ),
                    ),
                    endWith(processEndedActionCreator()),
                );
            }),
        );
    };

    return combineEpics(getOrCreateEpic, fetchDataEpic, fetchStorageEpic);
};

export default getProcessDataEpicsFactory;
