import { Action } from '@reduxjs/toolkit';
import { ofType, Epic } from 'redux-observable';
import { startWith, catchError, takeUntil, retryWhen, delay, take, mergeMap } from 'rxjs/operators';
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
        ofType(appStarted.toString(), reconnectToServer.toString()),
        takeUntil(action$.pipe(ofType(disconnectFromServer))),
        mergeMap(() =>
            webSocket({
                url: `${webSocketUrl}/${sessionId}`,
                WebSocketCtor: WebSocket,
            }).pipe(
                mergeMap((message) => handleWebSocketMessage(message as Message)),
                retryWhen((errors) =>
                    errors.pipe(delay(reconnectionTimeout), take(reconnectionMaxAttempts), (o) =>
                        merge(o, throwError(o)),
                    ),
                ),
                catchError((err) =>
                    of(
                        handleError(
                            `WebSocket connection failed after ${reconnectionMaxAttempts} tries.`,
                            err,
                        ),
                    ),
                ),
                takeUntil(
                    action$.pipe(
                        ofType(reconnectToServer.toString(), disconnectFromServer.toString()),
                    ),
                ),
                startWith(connectionReady()),
            ),
        ),
        filterNullAndUndefined(),
    );

export default connectToServerEpic;
