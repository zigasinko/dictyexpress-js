import { User } from '@genialis/resolwe/dist/api/types/rest';
import { userFetchSucceeded } from 'redux/stores/authentication';
import { PayloadAction } from '@reduxjs/toolkit';
import fetch from './fetch';
import { apiUrl } from './base';
import queryObserverManager from './queryObserverManager';

const baseUrl = `${apiUrl}/user`;

const getCurrentUser = async (): Promise<User> => {
    const getUserRequest = (): Promise<Response> =>
        fetch.get(baseUrl, { current_only: '1', observe: queryObserverManager.sessionId });

    const webSocketMessageOutputReduxAction = (
        items: unknown[],
    ): PayloadAction<User | undefined> => {
        return userFetchSucceeded(items[0] as User);
    };

    return (
        await queryObserverManager.reactiveRequest<User>(
            getUserRequest,
            webSocketMessageOutputReduxAction,
        )
    )[0];
};

export default { getCurrentUser };
