import { User } from '@genialis/resolwe/dist/api/types/rest';
import { userFetchSucceeded } from 'redux/stores/authentication';
import { PayloadAction } from '@reduxjs/toolkit';
import { apiUrl } from './base';
import { getReactive } from './fetch';
import { reactiveRequest } from './queryObserverManager';

const baseUrl = `${apiUrl}/user`;

// eslint-disable-next-line import/prefer-default-export
export const getCurrentUser = async (): Promise<User> => {
    const getUserRequest = (): Promise<Response> => getReactive(baseUrl, { current_only: '1' });

    const webSocketMessageOutputReduxAction = (
        items: unknown[],
    ): PayloadAction<User | undefined> => {
        return userFetchSucceeded(items[0] as User);
    };

    return (await reactiveRequest<User>(getUserRequest, webSocketMessageOutputReduxAction))[0];
};
