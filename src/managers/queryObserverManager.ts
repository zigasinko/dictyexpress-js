import { QueryObserverResponse, Message } from '@genialis/resolwe/dist/api/connection';
import _ from 'lodash';
import { Action } from '@reduxjs/toolkit';
import { deserializeResponse } from 'utils/apiUtils';
import { logError } from 'utils/errorUtils';
import { EMPTY, Observable } from 'rxjs';
import { sessionId } from '../api/base';
import { unsubscribe } from '../api/queryObserverApi';

const MESSAGE_ADDED = 'added';
const MESSAGE_CHANGED = 'changed';
const MESSAGE_REMOVED = 'removed';

type QueryObserver = {
    items: unknown[];
    observerId: string;
    webSocketMessageOutputObservable: (items: unknown[]) => Observable<Action | never>;
    handleWebSocketMessageWithMobxStore?: (items: unknown[]) => void;
};

export type DisposeFunction = () => Promise<void>;
export type ItemsAndDisposeFunction<T> = {
    items: T[];
    disposeFunction: DisposeFunction;
};

let observers: QueryObserver[] = [];

const unsubscribeObserver = (observerId: string): Promise<void> => {
    observers = _.remove(observers, { observerId });
    return unsubscribe(observerId, sessionId);
};

export const clearObservers = async (): Promise<void> => {
    const unsubscribePromises = observers.map((observer) =>
        unsubscribeObserver(observer.observerId),
    );

    try {
        await Promise.all(unsubscribePromises);
    } catch (error) {
        logError('Error unsubscribing from queryobserver.', error);
    }
};

export const reactiveRequest = async <T>(
    query: () => Promise<Response>,
    webSocketMessageOutputReduxAction: QueryObserver['webSocketMessageOutputObservable'],
): Promise<ItemsAndDisposeFunction<T>> => {
    const response = await query();
    const observerResponse = await deserializeResponse<QueryObserverResponse>(response);

    observers.push({
        observerId: observerResponse.observer,
        items: observerResponse.items,
        webSocketMessageOutputObservable: webSocketMessageOutputReduxAction,
    });

    return {
        items: observerResponse.items as T[],
        disposeFunction: (): Promise<void> => unsubscribeObserver(observerResponse.observer),
    };
};

export const reactiveRequestMobx = async <T>(
    query: () => Promise<Response>,
    handleWebSocketMessageWithMobxStore: QueryObserver['handleWebSocketMessageWithMobxStore'],
): Promise<ItemsAndDisposeFunction<T>> => {
    const response = await query();
    const observerResponse = await deserializeResponse<QueryObserverResponse>(response);

    observers.push({
        observerId: observerResponse.observer,
        items: observerResponse.items,
        handleWebSocketMessageWithMobxStore,
        webSocketMessageOutputObservable: () => EMPTY,
    });

    return {
        items: observerResponse.items as T[],
        disposeFunction: (): Promise<void> => unsubscribeObserver(observerResponse.observer),
    };
};

const getObserver = (observerId: string): QueryObserver | undefined => {
    return observers.find((observer) => observer.observerId === observerId);
};

const update = (message: Message, currentItems: unknown[]): unknown[] => {
    const { item: updatedItem } = message;

    let items = [...currentItems];
    switch (message.msg) {
        case MESSAGE_ADDED: {
            items = items.splice(message.order, 0, updatedItem);
            break;
        }
        case MESSAGE_REMOVED: {
            items = _.remove(items, {
                [message.primary_key]: _.get(updatedItem, message.primary_key),
            });
            break;
        }
        case MESSAGE_CHANGED: {
            // Remove item at previous index.
            items = _.remove(items, {
                [message.primary_key]: _.get(updatedItem, message.primary_key),
            });
            // Insert updated one at correct order index.
            items.splice(message.order, 0, updatedItem);
            break;
        }
        default: {
            throw new Error(`Unknown message type ${message.msg}`);
        }
    }

    return items;
};

export const handleWebSocketMessage = (message: Message): Observable<Action | never> => {
    const observer = getObserver(message.observer);
    if (observer == null) {
        return EMPTY;
    }
    observer.items = update(message, observer.items);

    return observer.webSocketMessageOutputObservable(observer.items);
};

export const handleWebSocketMessageMobx = (message: Message): void => {
    const observer = getObserver(message.observer);
    if (observer == null) {
        return;
    }
    observer.items = update(message, observer.items);

    observer.handleWebSocketMessageWithMobxStore?.(observer.items);
};
