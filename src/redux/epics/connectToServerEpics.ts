import { Action } from '@reduxjs/toolkit';
import { ofType, Epic } from 'redux-observable';
import {
    startWith,
    catchError,
    takeUntil,
    retryWhen,
    delay,
    mergeMap,
    filter,
    mergeWith,
} from 'rxjs/operators';
import { iif, of, throwError } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import { webSocket } from 'rxjs/webSocket';
import { handleError } from 'utils/errorUtils';
import { sessionId, webSocketUrl } from 'api/base';
import { handleWebSocketMessage, WebSocketMessage } from 'managers/queryObserverManager';
import { filterNullAndUndefined } from './rxjsCustomFilters';
import {
    appStarted,
    connectionReady,
    disconnectFromServer,
    reconnectToServer,
} from './epicsActions';

const reconnectionTimeout = 6000;
const reconnectionMaxAttempts = 3;

class ConnectToWebSocketError extends Error {}

const connectToServerEpic: Epic<Action, Action, RootState> = (action$) =>
    action$.pipe(
        ofType(appStarted.toString(), reconnectToServer.toString()),
        takeUntil(action$.pipe(ofType(disconnectFromServer))),
        mergeMap(() =>
            webSocket({
                url: `${webSocketUrl}/${sessionId}`,
                WebSocketCtor: WebSocket,
            }).pipe(
                retryWhen((errors) => {
                    return errors.pipe(
                        mergeMap((e, i) => {
                            return iif(
                                () => i + 1 >= reconnectionMaxAttempts,
                                throwError(() => new ConnectToWebSocketError()),
                                of(e).pipe(delay(reconnectionTimeout)),
                            );
                        }),
                    );
                }),
                mergeMap((message) => handleWebSocketMessage(message as WebSocketMessage)),
                takeUntil(
                    action$.pipe(
                        filter(reconnectToServer.match),
                        mergeWith(action$.pipe(filter(disconnectFromServer.match))),
                    ),
                ),
                startWith(connectionReady()),
                catchError((err) => {
                    return of(
                        handleError(
                            err instanceof ConnectToWebSocketError
                                ? `WebSocket connection failed after ${reconnectionMaxAttempts} tries.`
                                : `WebSocket message handler error.`,
                            err,
                        ),
                    );
                }),
            ),
        ),
        filterNullAndUndefined(),
    );

export default connectToServerEpic;
