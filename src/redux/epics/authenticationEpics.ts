import { createAction } from '@reduxjs/toolkit';
import { ofType, Epic } from 'redux-observable';
import { map, startWith, endWith, catchError, mergeMap } from 'rxjs/operators';
import { of, from } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import { pushToSentryAndAddErrorSnackbar } from 'redux/stores/notifications';
import {
    fetchUserSucceeded,
    loginStarted,
    fetchUserStarted,
    fetchUserEnded,
    loginEnded,
    logoutStarted,
    logoutEnded,
} from 'redux/stores/authentication';
import * as authApi from 'api/authApi';
import * as userApi from 'api/userApi';
import { clearObservers } from 'api/queryObserverManager';
import { appStarted } from './connectToServerEpic';

// Export epic actions.
export const login = createAction<{ username: string; password: string }>('authentication/login');
export const loginSucceeded = createAction('authentication/loginSucceeded');
export const logout = createAction('authentication/logout');
export const logoutSucceeded = createAction('authentication/logoutSucceeded');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const loginEpic: Epic<any, any, RootState, any> = (action$) =>
    action$.pipe(
        ofType(login),
        mergeMap((action) => {
            return from(authApi.login(action.payload.username, action.payload.password)).pipe(
                mergeMap(() => {
                    return from(clearObservers()).pipe(map(loginSucceeded));
                }),
                catchError((error) =>
                    of(pushToSentryAndAddErrorSnackbar(`Error logging in.`, error)),
                ),
                startWith(loginStarted()),
                endWith(loginEnded()),
            );
        }),
    );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logoutEpic: Epic<any, any, RootState, any> = (action$) =>
    action$.pipe(
        ofType(logout),
        mergeMap(() => {
            return from(authApi.logout()).pipe(
                mergeMap(() => {
                    return from(clearObservers()).pipe(map(logoutSucceeded));
                }),
                catchError((error) =>
                    of(pushToSentryAndAddErrorSnackbar(`Error logging out.`, error)),
                ),
                startWith(logoutStarted()),
                endWith(logoutEnded()),
            );
        }),
    );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCurrentUserEpic: Epic<any, any, RootState, any> = (action$) =>
    action$.pipe(
        ofType(appStarted.toString(), loginSucceeded.toString(), logoutSucceeded.toString()),
        mergeMap(() => {
            return from(userApi.getCurrentUser()).pipe(
                map(fetchUserSucceeded),
                catchError((error) =>
                    of(pushToSentryAndAddErrorSnackbar(`Error fetching user profile`, error)),
                ),
                startWith(fetchUserStarted()),
                endWith(fetchUserEnded()),
            );
        }),
    );
