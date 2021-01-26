import { Data, DONE_DATA_STATUS } from '@genialis/resolwe/dist/api/types/rest';
import { handleError } from 'utils/errorUtils';
import {
    DisposeFunction as QueryObserverDisposeFunction,
    reactiveRequest,
} from 'managers/queryObserverManager';
import { Action } from '@reduxjs/toolkit';
import { Observable } from 'rxjs';
import { deserializeResponse } from '../utils/apiUtils';
import { apiUrl } from './base';
import { get, getReactive } from './fetch';

const baseUrl = `${apiUrl}/data`;

export const getGafs = async (): Promise<Data[]> => {
    const getGafsResponse = await get(baseUrl, {
        type: 'data:gaf',
        status: DONE_DATA_STATUS,
    });

    return deserializeResponse<Data[]>(getGafsResponse);
};

export const getDataBySamplesIds = async (samplesIds: number[]): Promise<Data[]> => {
    if (samplesIds.length === 0) {
        return [] as Data[];
    }

    const getSamplesDataResponse = await get(baseUrl, {
        type: 'data:expression',
        entity__in: samplesIds.join(','),
    });

    return deserializeResponse<Data[]>(getSamplesDataResponse);
};

export const getDataReactive = async <T>(
    dataId: number,
    handleDataResponse: (items: T) => Observable<Action | never>,
): Promise<{ item: T; disposeFunction: QueryObserverDisposeFunction }> => {
    const getClusteringDataRequest = (): Promise<Response> => getReactive(baseUrl, { id: dataId });

    const webSocketMessageOutputReduxAction = (
        items: unknown[],
    ): Observable<ReturnType<typeof handleError> | Action | never> => {
        return handleDataResponse(items[0] as T);
    };

    const { items, disposeFunction } = await reactiveRequest<T>(
        getClusteringDataRequest,
        webSocketMessageOutputReduxAction,
    );
    return { item: items[0], disposeFunction };
};
