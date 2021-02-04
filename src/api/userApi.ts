import { User } from '@genialis/resolwe/dist/api/types/rest';
import { userFetchSucceeded } from 'redux/stores/authentication';
import { PayloadAction } from '@reduxjs/toolkit';
import { Observable, of } from 'rxjs';
import { apiUrl } from './base';
import { getReactive } from './fetch';
import { reactiveRequest } from '../managers/queryObserverManager';

const baseUrl = `${apiUrl}/user`;

export const getCurrentUser = async (): Promise<User> => {
    const getUserRequest = (): Promise<Response> => getReactive(baseUrl, { current_only: '1' });

    const webSocketMessageOutputReduxAction = (
        items: unknown[],
    ): Observable<PayloadAction<User | undefined>> => {
        return of(userFetchSucceeded(items[0] as User));
    };

    return (await reactiveRequest<User>(getUserRequest, webSocketMessageOutputReduxAction))
        .items[0];
};
