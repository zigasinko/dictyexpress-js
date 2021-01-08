import {
    Data,
    DataGOEnrichmentAnalysis,
    DONE_DATA_STATUS,
    ERROR_DATA_STATUS,
} from '@genialis/resolwe/dist/api/types/rest';
import { PayloadAction } from '@reduxjs/toolkit';
import { gOEnrichmentDataFetchSucceeded } from 'redux/epics/epicsActions';
import { deserializeResponse } from '../utils/apiUtils';
import { apiUrl } from './base';
import { get, getReactive } from './fetch';
import { reactiveRequest } from './queryObserverManager';

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

/**
 * Determines if analysis was successful (throws error if not) and returns "fetchGOEnrichmentStorage"
 * action, if output terms (storageId) is not empty.
 * @param response
 */
export const getDataFetchSucceededActionIfDone = (
    response: DataGOEnrichmentAnalysis,
): PayloadAction<DataGOEnrichmentAnalysis> | null => {
    if (response.status === ERROR_DATA_STATUS) {
        throw new Error(
            `Analysis ended with an error ${
                response.process_error.length > 0 ? response.process_error[0] : ''
            }`,
        );
    }

    // TODO: check if this condition is ok or would status be better?
    if (response.output.terms != null) {
        return gOEnrichmentDataFetchSucceeded(response);
    }

    return null;
};

export const getGOEnrichmentData = async (dataId: number): Promise<DataGOEnrichmentAnalysis> => {
    const getGOEnrichmentDataRequest = (): Promise<Response> =>
        getReactive(baseUrl, { id: dataId });

    const webSocketMessageOutputReduxAction = (
        items: unknown[],
    ): PayloadAction<DataGOEnrichmentAnalysis> | null => {
        return getDataFetchSucceededActionIfDone(items[0] as DataGOEnrichmentAnalysis);
    };

    return (
        await reactiveRequest<DataGOEnrichmentAnalysis>(
            getGOEnrichmentDataRequest,
            webSocketMessageOutputReduxAction,
        )
    )[0];
};
