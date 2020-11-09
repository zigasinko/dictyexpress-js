import { Action } from '@reduxjs/toolkit';
import { ofType, Epic, combineEpics } from 'redux-observable';
import {
    map,
    startWith,
    catchError,
    switchMap,
    takeUntil,
    retryWhen,
    delay,
    take,
} from 'rxjs/operators';
import { concat, of, throwError } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import { webSocket } from 'rxjs/webSocket';
import queryObserverManager from 'api/queryObserverManager';
import { Message } from '@genialis/resolwe/dist/api/connection';
import { handleError } from 'utils/errorUtils';
import { filterNullAndUndefined } from './rxjsCustomFilters';
import {
    appStarted,
    connectionReady,
    connectToServer,
    disconnectFromServer,
    reconnectToServer,
} from './epicsActions';

// ReconnectionTimeout = 60s.
const reconnectionTimeout = 6000;
const reconnectionMaxAttempts = 3;

const connectToWebSocketServiceEpic: Epic<Action, Action, RootState> = (action$) =>
    action$.pipe(
        ofType(appStarted),
        map(() => {
            return connectToServer({
                url: 'wss://qa2.genialis.com/ws/',
            });
        }),
    );

const connectToServerEpic: Epic<Action, Action, RootState> = (action$) =>
    action$.pipe(
        ofType<Action, ReturnType<typeof connectToServer>>(connectToServer.toString()),
        switchMap(({ payload: { url } }) => {
            return action$.pipe(
                ofType(reconnectToServer),
                takeUntil(action$.pipe(ofType(disconnectFromServer))),
                startWith(null),
                map(() => {
                    return webSocket({
                        url: `${url + queryObserverManager.sessionId}?subscribe-broadcast`,
                        WebSocketCtor: WebSocket,
                    });
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
                        map((message) => {
                            return queryObserverManager.handleWebSocketMessage(message as Message);
                        }),
                        filterNullAndUndefined(),
                        retryWhen((errors) =>
                            errors.pipe(
                                delay(reconnectionTimeout),
                                take(reconnectionMaxAttempts),
                                (o) => concat(o, throwError(o)),
                            ),
                        ),
                        catchError((err) => {
                            return of(
                                handleError(
                                    `WebSocket connection failed after ${reconnectionMaxAttempts} tries.`,
                                    err,
                                ),
                            );
                        }),
                        startWith(connectionReady()),
                    ),
                ),
            );
        }),
    );

export default combineEpics(connectToWebSocketServiceEpic, connectToServerEpic);
