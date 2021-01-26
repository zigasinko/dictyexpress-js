import { Action } from '@reduxjs/toolkit';
import { ofType, Epic } from 'redux-observable';
import {
    map,
    startWith,
    catchError,
    switchMap,
    takeUntil,
    retryWhen,
    delay,
    take,
    mergeMap,
} from 'rxjs/operators';
import { merge, of, throwError } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import { webSocket } from 'rxjs/webSocket';
import { Message } from '@genialis/resolwe/dist/api/connection';
import { handleError } from 'utils/errorUtils';
import { sessionId, webSocketUrl } from 'api/base';
import { handleWebSocketMessage } from 'managers/queryObserverManager';
import { filterNullAndUndefined } from './rxjsCustomFilters';
import {
    appStarted,
    connectionReady,
    disconnectFromServer,
    reconnectToServer,
} from './epicsActions';

const reconnectionTimeout = 6000;
const reconnectionMaxAttempts = 3;

const connectToServerEpic: Epic<Action, Action, RootState> = (action$) =>
    action$.pipe(
        ofType(appStarted),
        mergeMap(() => {
            return action$.pipe(
                ofType(reconnectToServer),
                takeUntil(action$.pipe(ofType(disconnectFromServer))),
                startWith(null),
                map(() => {
                    return webSocket({
                        url: `${webSocketUrl + sessionId}`,
                        WebSocketCtor: WebSocket,
                    }).pipe(
                        retryWhen((errors) => {
                            return errors.pipe(
                                delay(reconnectionTimeout),
                                take(reconnectionMaxAttempts),
                                (o) => merge(o, throwError(o)),
                            );
                        }),
                        catchError((err) => {
                            return of(
                                handleError(
                                    `WebSocket connection failed after ${reconnectionMaxAttempts} tries.`,
                                    err,
                                ),
                            );
                        }),
                    );
                }),
                switchMap((webSocketConnection$) =>
                    webSocketConnection$.pipe(
                        takeUntil(
                            action$.pipe(
                                ofType(
                                    reconnectToServer.toString(),
                                    disconnectFromServer.toString(),
                                ),
                            ),
                        ),
                        mergeMap((message) => {
                            return handleWebSocketMessage(message as Message);
                        }),
                        filterNullAndUndefined(),
                    ),
                ),
                startWith(connectionReady()),
            );
        }),
    );

export default connectToServerEpic;
