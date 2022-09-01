import { User } from '@genialis/resolwe/dist/api/types/rest';
import { userFetchSucceeded } from 'redux/stores/authentication';
import { apiUrl } from './base';
import { get } from '../api/fetch';
import { deserializeResponse } from 'utils/apiUtils';

const baseUrl = `${apiUrl}/user`;

export const getCurrentUser = async (): Promise<User | undefined> => {
    return get(baseUrl, { current_only: '1' })
        .then((resp) => deserializeResponse<User[]>(resp))
        .then((user) => userFetchSucceeded(user[0]).payload);
};
