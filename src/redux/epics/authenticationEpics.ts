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
import { handleError } from 'utils/errorUtils';
import _ from 'lodash';
import { addErrorSnackbar } from 'redux/stores/notifications';
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from 'api';
import { clearObservers } from 'api/queryObserverManager';
import { setSentryUser } from 'utils/sentryUtils';
import { ResponseError } from 'redux/models/internal';
import { appStarted, login, loginSucceeded, logout, logoutSucceeded } from './epicsActions';

const loginEpic: Epic<Action, Action, RootState> = (action$) =>
    action$.pipe(
        ofType<Action, ReturnType<typeof login>>(login.toString()),
        mergeMap((action) => {
            return from(loginRequest(action.payload.username, action.payload.password)).pipe(
                mergeMap(() => from(clearObservers()).pipe(map(loginSucceeded))),
                catchError((error) => {
                    if (error instanceof ResponseError) {
                        return from(error.response.json()).pipe(
                            map((responseJson) => {
                                const errorMessage = _.values(responseJson).join('\n');
                                return addErrorSnackbar(errorMessage);
                            }),
                        );
                    }
                    return of(handleError(`Error logging in.`));
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
            return from(logoutRequest()).pipe(
                mergeMap(() => {
                    return from(clearObservers()).pipe(map(logoutSucceeded));
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
            return from(getCurrentUser()).pipe(
                map((user) => {
                    // Propagate user to sentry context, so future sentry logs will include
                    // user information.
                    setSentryUser(user);
                    return userFetchSucceeded(user);
                }),
                catchError((error) => of(handleError(`Error fetching user profile`, error))),
                startWith(userFetchStarted()),
                endWith(userFetchEnded()),
            );
        }),
    );

export default combineEpics(loginEpic, logoutEpic, getCurrentUserEpic);
