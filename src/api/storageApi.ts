import { Storage } from '@genialis/resolwe/dist/api/types/rest';
import { deserializeResponse } from '../utils/apiUtils';
import fetch from './fetch';
import { apiUrl } from './base';

const baseUrl = `${apiUrl}/storage`;

// eslint-disable-next-line import/prefer-default-export
export const getStorageJson = async (storageId: number): Promise<Storage> => {
    const url = `${baseUrl}/${storageId}`;

    const getStorageJsonResponse = await fetch.get(url);

    return deserializeResponse<Storage>(getStorageJsonResponse);
};

export const getGOEnrichmentJson = async (storageId: number): Promise<Storage> => {
    const url = `${baseUrl}/${storageId}`;

    return deserializeResponse<Storage>(await fetch.get(url));
};
