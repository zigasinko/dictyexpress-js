import { Action, createAction } from '@reduxjs/toolkit';
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
} from 'rxjs/operators';
import { concat, of, throwError } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import { webSocket } from 'rxjs/webSocket';
import queryObserverManager from 'api/queryObserverManager';
import { Message } from '@genialis/resolwe/dist/api/connection';
import { handleError } from 'utils/errorUtils';
import { filterNullAndUndefined } from './rxjsCustomFilters';

// ReconnectionTimeout = 60s.
const reconnectionTimeout = 6000;
const reconnectionMaxAttempts = 3;

// Export epic actions.
export const appStarted = createAction('appStarted');
export const connectToServer = createAction<{
    url: string;
}>('connectToServer/connect');
export const reconnectToServer = createAction('connectToServer/reconnect');
export const disconnectFromServer = createAction('connectToServer/disconnect');
export const connectionReady = createAction('connectToServer/connectionReady');

export const connectToWebSocketServiceEpic: Epic<Action, Action, RootState> = (action$) =>
    action$.pipe(
        ofType(appStarted),
        map(() => {
            return connectToServer({
                url: 'wss://qa2.genialis.com/ws/',
            });
        }),
    );

export const connectToServerEpic: Epic<Action, Action, RootState> = (action$) =>
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
