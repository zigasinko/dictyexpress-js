import { User } from '@genialis/resolwe/dist/api/types/rest';
import { fetchUserSucceeded } from 'redux/stores/authentication';
import { PayloadAction } from '@reduxjs/toolkit';
import fetch from './fetch';
import { apiUrl } from './base';
import { reactiveRequest, sessionId } from './queryObserverManager';

const baseUrl = `${apiUrl}/user`;

// eslint-disable-next-line import/prefer-default-export
export const getCurrentUser = async (): Promise<User> => {
    const getUserRequest = (): Promise<Response> =>
        fetch.get(baseUrl, { current_only: '1', observe: sessionId });

    const webSocketMessageOutputReduxAction = (items: unknown[]): PayloadAction<User> => {
        return fetchUserSucceeded(items[0] as User);
    };

    return (await reactiveRequest<User>(getUserRequest, webSocketMessageOutputReduxAction))[0];
};
