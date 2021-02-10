import { map, catchError, retryWhen, delay, take } from 'rxjs/operators';
import { EMPTY, merge, throwError } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { Message } from '@genialis/resolwe/dist/api/connection';
import { sessionId, webSocketUrl } from 'api/base';
// eslint-disable-next-line import/no-cycle
import { handleWebSocketMessageMobx } from 'managers/queryObserverManager';
import { fromStream } from 'mobx-utils';

class WebSocketStoreMobx {
    reconnectionTimeout = 6000;

    reconnectionMaxAttempts = 3;

    connect(): void {
        fromStream(
            webSocket({
                url: `${webSocketUrl + sessionId}`,
                WebSocketCtor: WebSocket,
            }).pipe(
                retryWhen((errors) => {
                    return errors.pipe(
                        delay(this.reconnectionTimeout),
                        take(this.reconnectionMaxAttempts),
                        (o) => merge(o, throwError(o)),
                    );
                }),
                catchError(() => {
                    // eslint-disable-next-line no-console
                    console.log(
                        `WebSocket connection failed after ${this.reconnectionMaxAttempts} tries.`,
                    );
                    return EMPTY;
                }),
                map((message) => {
                    handleWebSocketMessageMobx(message as Message);
                }),
            ),
        );
    }
}

export default WebSocketStoreMobx;
