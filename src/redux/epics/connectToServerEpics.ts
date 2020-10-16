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
    filter,
} from 'rxjs/operators';
import { concat, of, throwError } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import { webSocket } from 'rxjs/webSocket';
import { handleWebSocketMessage } from 'api/queryObserverManager';
import { Message } from '@genialis/resolwe/dist/api/connection';
import { pushToSentryAndAddErrorSnackbar } from 'redux/stores/notifications';
import { sessionId } from 'api/base';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const connectToWebSocketServiceEpic: Epic<any, any, RootState, any> = (action$) =>
    action$.pipe(
        ofType(appStarted),
        map(() => {
            return connectToServer({
                url: 'wss://qa2.genialis.com/ws/',
            });
        }),
    );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const connectToServerEpic: Epic<any, any, RootState, any> = (action$) =>
    action$.pipe(
        ofType(connectToServer),
        switchMap(({ payload: { url } }) => {
            return action$.pipe(
                ofType(reconnectToServer),
                takeUntil(action$.pipe(ofType(disconnectFromServer))),
                startWith(null),
                map(() => {
                    return webSocket({
                        url: `${url + sessionId}?subscribe-broadcast`,
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
                            return handleWebSocketMessage(message as Message);
                        }),
                        filter((outputAction) => outputAction != null),
                        retryWhen((errors) =>
                            errors.pipe(
                                delay(reconnectionTimeout),
                                take(reconnectionMaxAttempts),
                                (o) => concat(o, throwError(o)),
                            ),
                        ),
                        catchError((err) => {
                            return of(
                                pushToSentryAndAddErrorSnackbar(
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
