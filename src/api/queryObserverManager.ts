import { QueryObserverResponse, Message } from '@genialis/resolwe/dist/api/connection';
import _ from 'lodash';
import { Action } from '@reduxjs/toolkit';
import { deserializeResponse } from 'utils/apiUtils';
import queryObserverApi from 'api/queryObserverApi';
import { logError } from 'utils/errorUtils';
import { sessionId } from './base';

const MESSAGE_ADDED = 'added';
const MESSAGE_CHANGED = 'changed';
const MESSAGE_REMOVED = 'removed';

type QueryObserver = {
    items: unknown[];
    observerId: string;
    webSocketMessageOutputReduxAction: (items: unknown[]) => Action | null;
};

let observers: QueryObserver[] = [];

/**
 * Unsubscribes all existing observers from WebSocket and clears observers array.
 */
const clearObservers = async (): Promise<void> => {
    const unsubscribePromises = observers.map((observer) =>
        queryObserverApi.unsubscribe(observer.observerId, sessionId),
    );

    try {
        await Promise.all(unsubscribePromises);
    } catch (error) {
        logError('Error unsubscribing from queryobserver.', error);
    }

    observers = [];
};

/**
 * Performs a query and pushes it's parameters to list of observers that will be used (dispatched)
 * for incoming WebSocket messages. For query to be reactive it needs to have "observe" parameter
 * filled with GUID (sessionId).
 *
 * @param query - Query with parameter observe=guid.
 * @param webSocketMessageOutputReduxAction - Redux action that will be called after WebSocket emits
 * a new message with the same observe guid.
 */
const reactiveRequest = async <T>(
    query: () => Promise<Response>,
    webSocketMessageOutputReduxAction: QueryObserver['webSocketMessageOutputReduxAction'],
): Promise<T[]> => {
    const response = await query();
    const observerResponse = await deserializeResponse<QueryObserverResponse>(response);

    observers.push({
        observerId: observerResponse.observer,
        items: observerResponse.items,
        webSocketMessageOutputReduxAction,
    });

    return observerResponse.items as T[];
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

/**
 * Gets the correct observer based on observerId, updates it's items (based on WebSocket message)
 * and returns redux Action that should be dispatched to redux (usually fetchSucceeded with
 * payload).
 * @param message - Incoming WebSocket message.
 */
const handleWebSocketMessage = (message: Message): Action | null => {
    const observer = getObserver(message.observer);
    if (observer == null) {
        return null;
    }
    observer.items = update(message, observer.items);
    return observer.webSocketMessageOutputReduxAction(observer.items);
};

export default { clearObservers, reactiveRequest, handleWebSocketMessage };
