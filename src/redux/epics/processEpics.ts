import { ofType, Epic, combineEpics } from 'redux-observable';
import {
    map,
    startWith,
    endWith,
    catchError,
    withLatestFrom,
    switchMap,
    mergeMap,
} from 'rxjs/operators';
import { of, from, EMPTY, Observable, merge, isObservable } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import { handleError } from 'utils/errorUtils';
import { Action, ActionCreatorWithoutPayload, ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { DisposeFunction as QueryObserverDisposeFunction } from 'api/queryObserverManager';
import {
    Data,
    DONE_DATA_STATUS,
    ERROR_DATA_STATUS,
    Storage,
} from '@genialis/resolwe/dist/api/types/rest';
import { ProcessInfo } from 'redux/models/internal';
import _ from 'lodash';
import { getDataReactive, getStorage, getOrCreateData } from 'api';

export const ProcessesInfo: { [_: string]: ProcessInfo } = {
    HierarchicalClustering: {
        name: 'Hierarchical clustering',
        slug: 'clustering-hierarchical-etc',
    },
    GOEnrichment: {
        name: 'Gene Ontology Enrichment',
        slug: 'goenrichment',
    },
};

/* If analysis isn't cached on the server, it's data will be pushed via WebSocket. So if any of parameters
 * change, we must unsubscribe previous queryObserver. This way we avoid race conditions.
 */
const activeQueryObserverDisposeFunction: { [_: string]: QueryObserverDisposeFunction } = {};

export type GetGetOrCreateEpicsProps<DataType> = {
    processInfo: ProcessInfo;
    inputActions: string[];
    getGetOrCreateInput: (state: RootState) => object | Observable<ReturnType<typeof handleError>>;
    fetchDataActionCreator: ActionCreatorWithPayload<number>;
    processStartedActionCreator: ActionCreatorWithoutPayload;
    processEndedActionCreator: ActionCreatorWithoutPayload;
    fetchDataSucceededActionCreator: ActionCreatorWithPayload<DataType>;
    getStorageIdFromData: (data: DataType) => number;
    actionFromStorageResponse: (storage: Storage, state: RootState) => Action;
};

/**
 * Creates needed epics to handle everything process related:
 * - initiate process (getOrCreateEpic),
 * - fetch it's data (fetchDataEpic),
 * - fetch data storage (fetchStorageEpic).
 */
const GetGetOrCreateEpics = <DataType extends Data>({
    processInfo,
    inputActions,
    getGetOrCreateInput,
    fetchDataActionCreator,
    processStartedActionCreator,
    processEndedActionCreator,
    fetchDataSucceededActionCreator,
    getStorageIdFromData,
    actionFromStorageResponse,
}: GetGetOrCreateEpicsProps<DataType>): Epic<Action, Action, RootState> => {
    /**
     * Determines if analysis was successful (throws error if not) and returns Observable
     * with "fetchDataSucceededActionCreator" action, if process ended successfully.
     * @param response - Process data response.
     */
    const handleAnalysisDataResponse = (response: DataType): Observable<Action | never> => {
        if (response.status === ERROR_DATA_STATUS) {
            const errorMessage = `${processInfo.name} analysis ended with an error ${
                response.process_error.length > 0 ? response.process_error[0] : ''
            }`;
            return merge(
                of(handleError(errorMessage, new Error(errorMessage))),
                of(processEndedActionCreator()),
            );
        }

        if (response.status === DONE_DATA_STATUS && getStorageIdFromData(response) != null) {
            return of(fetchDataSucceededActionCreator(response));
        }

        return EMPTY;
    };

    /**
     * Call get or create (and get the data after process is done via WebSocket) process.
     */
    const getOrCreateEpic: Epic<Action, Action, RootState> = (action$, state$) => {
        return action$.pipe(
            ofType(...inputActions),
            withLatestFrom(state$),
            switchMap(([, state]) => {
                // Cleanup queryObserverManager existing observer waiting to receive process
                // data via WebSocket.
                if (activeQueryObserverDisposeFunction[processInfo.name] != null) {
                    activeQueryObserverDisposeFunction[processInfo.name]();
                }

                const input = getGetOrCreateInput(state);
                if (_.isEmpty(input)) {
                    return of(processEndedActionCreator());
                }

                if (isObservable(input)) {
                    return input;
                }

                return from(getOrCreateData(input, processInfo.slug)).pipe(
                    map((response) => fetchDataActionCreator(response.id)),
                    catchError((error) =>
                        of(
                            handleError(
                                `Error creating ${processInfo.name.toLowerCase()} process.`,
                                error,
                            ),
                        ),
                    ),
                    startWith(processStartedActionCreator()),
                );
            }),
        );
    };

    /**
     * Fetch process data. The response has to be handled the same way coming from
     * the request or via WebSocket:
     *  - wait till data status is DONE,
     *  - issue an fetchDataSucceededActionCreator with output data that will be used to fetch
     *  it's storage.
     */
    const fetchDataEpic: Epic<Action, Action, RootState> = (action$) => {
        return action$.pipe(
            ofType<Action, ReturnType<typeof fetchDataActionCreator>>(
                fetchDataActionCreator.toString(),
            ),
            switchMap((action) => {
                return from(getDataReactive(action.payload, handleAnalysisDataResponse)).pipe(
                    mergeMap((response) => {
                        activeQueryObserverDisposeFunction[processInfo.name] =
                            response.disposeFunction;
                        return handleAnalysisDataResponse(response.item);
                    }),
                    catchError((error) => {
                        return of(
                            handleError(`${processInfo.name} analysis ended with an error.`, error),
                        );
                    }),
                );
            }),
        );
    };

    /**
     * Once data object has a DONE status (fetchDataSucceededActionCreator), fetch it's storage
     * and save it to store.
     */
    const fetchStorageEpic: Epic<Action, Action, RootState> = (action$, state$) => {
        return action$.pipe(
            ofType<Action, ReturnType<typeof fetchDataSucceededActionCreator>>(
                fetchDataSucceededActionCreator.toString(),
            ),
            withLatestFrom(state$),
            switchMap(([action, state]) => {
                return from(getStorage(getStorageIdFromData(action.payload))).pipe(
                    map((storage) => {
                        return actionFromStorageResponse(storage, state);
                    }),
                    catchError((error) => {
                        return of(
                            handleError(
                                `Error retrieving ${processInfo.name.toLowerCase()} storage.`,
                                error,
                            ),
                        );
                    }),
                    endWith(processEndedActionCreator()),
                );
            }),
        );
    };

    return combineEpics(getOrCreateEpic, fetchDataEpic, fetchStorageEpic);
};

export default GetGetOrCreateEpics;
