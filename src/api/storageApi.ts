import { Storage } from '@genialis/resolwe/dist/api/types/rest';
import { deserializeResponse } from '../utils/apiUtils';
import fetch from './fetch';
import { apiUrl } from './base';

const baseUrl = `${apiUrl}/storage`;

const getStorageJson = async (storageId: number): Promise<Storage> => {
    const url = `${baseUrl}/${storageId}`;

    const getStorageJsonResponse = await fetch.get(url);

    return deserializeResponse<Storage>(getStorageJsonResponse);
};

export default { getStorageJson };
