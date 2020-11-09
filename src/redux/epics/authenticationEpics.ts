import { Action } from '@reduxjs/toolkit';
import { ofType, Epic, combineEpics } from 'redux-observable';
import { map, startWith, endWith, catchError, mergeMap } from 'rxjs/operators';
import { of, from } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import {
    userFetchSucceeded,
    loginStarted,
    userFetchStarted,
    userFetchEnded,
    loginEnded,
    logoutStarted,
    logoutEnded,
} from 'redux/stores/authentication';
import authApi from 'api/authApi';
import userApi from 'api/userApi';
import queryObserverManager from 'api/queryObserverManager';
import { handleError } from 'utils/errorUtils';
import _ from 'lodash';
import { addErrorSnackbar } from 'redux/stores/notifications';
import { appStarted, login, loginSucceeded, logout, logoutSucceeded } from './epicsActions';

const loginEpic: Epic<Action, Action, RootState> = (action$) =>
    action$.pipe(
        ofType<Action, ReturnType<typeof login>>(login.toString()),
        mergeMap((action) => {
            return from(authApi.login(action.payload.username, action.payload.password)).pipe(
                mergeMap((response) => {
                    if (!response.ok) {
                        return from(response.json()).pipe(
                            map((responseJson) => {
                                const errorMessage = _.values(responseJson).join('\n');
                                return addErrorSnackbar(errorMessage);
                            }),
                        );
                    }
                    return from(queryObserverManager.clearObservers()).pipe(map(loginSucceeded));
                }),
                catchError((error) => {
                    return of(handleError(`Error logging in.`, error));
                }),
                startWith(loginStarted()),
                endWith(loginEnded()),
            );
        }),
    );

const logoutEpic: Epic<Action, Action, RootState> = (action$) =>
    action$.pipe(
        ofType(logout),
        mergeMap(() => {
            return from(authApi.logout()).pipe(
                mergeMap(() => {
                    return from(queryObserverManager.clearObservers()).pipe(map(logoutSucceeded));
                }),
                catchError((error) => of(handleError(`Error logging out.`, error))),
                startWith(logoutStarted()),
                endWith(logoutEnded()),
            );
        }),
    );

const getCurrentUserEpic: Epic<Action, Action, RootState> = (action$) =>
    action$.pipe(
        ofType(appStarted.toString(), loginSucceeded.toString(), logoutSucceeded.toString()),
        mergeMap(() => {
            return from(userApi.getCurrentUser()).pipe(
                map(userFetchSucceeded),
                catchError((error) => of(handleError(`Error fetching user profile`, error))),
                startWith(userFetchStarted()),
                endWith(userFetchEnded()),
            );
        }),
    );

export default combineEpics(loginEpic, logoutEpic, getCurrentUserEpic);
