import { Action } from '@reduxjs/toolkit';
import { ofType, Epic, combineEpics } from 'redux-observable';
import { map, mergeMap, startWith, endWith, catchError } from 'rxjs/operators';
import { of, from } from 'rxjs';
import {
    getSelectedTimeSeriesSamplesIds,
    addToBasketStarted,
    addToBasketEnded,
    addSamplesToBasketSucceeded,
    timeSeriesFetchStarted,
    timeSeriesFetchEnded,
    timeSeriesFetchSucceeded,
    fetchBasketExpressionsIdsSucceeded,
    getBasketInfo,
    getBasketExpressionsIds,
} from 'redux/stores/timeSeries';
import { RootState } from 'redux/rootReducer';
import { BasketInfo } from 'redux/models/internal';
import { handleError } from 'utils/errorUtils';
import { addToBasket, getTimeSeriesRelations, getBasketExpressions } from 'api';
import { fetchTimeSeries, loginSucceeded } from './epicsActions';
import { mapStateSlice } from './rxjsCustomFilters';

const fetchTimeSeriesEpic: Epic<Action, Action, RootState> = (action$) => {
    return action$.pipe(
        ofType(fetchTimeSeries.toString(), loginSucceeded.toString()),
        mergeMap(() => {
            return from(getTimeSeriesRelations()).pipe(
                map((response) => timeSeriesFetchSucceeded(response)),
                catchError((error) => of(handleError(`Error retrieving time series.`, error))),
                startWith(timeSeriesFetchStarted()),
                endWith(timeSeriesFetchEnded()),
            );
        }),
    );
};

const timeSeriesSelectedEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return state$.pipe(
        mapStateSlice(
            (state) => getSelectedTimeSeriesSamplesIds(state.timeSeries),
            (timeSeriesSamplesIds) => timeSeriesSamplesIds.length > 0,
        ),
        mergeMap((timeSeriesSamplesIds) => {
            return from(addToBasket(timeSeriesSamplesIds)).pipe(
                map((response) => addSamplesToBasketSucceeded(response)),
                catchError((error) =>
                    of(
                        handleError(
                            `Error adding time series samples to visualization basket.`,
                            error,
                        ),
                    ),
                ),
                startWith(addToBasketStarted()),
                endWith(addToBasketEnded()),
            );
        }),
    );
};

const fetchBasketExpressionsEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return state$.pipe(
        mapStateSlice<BasketInfo>(
            (state) => getBasketInfo(state.timeSeries),
            () => getBasketExpressionsIds(state$.value.timeSeries).length === 0,
        ),
        mergeMap((basketInfo) => {
            return from(getBasketExpressions(basketInfo.id)).pipe(
                map((basketExpressions) => {
                    return fetchBasketExpressionsIdsSucceeded(
                        basketExpressions.map((basketExpression) => basketExpression.id),
                    );
                }),
                catchError((error) => of(handleError(`Error fetching basket expressions.`, error))),
            );
        }),
    );
};

export default combineEpics(
    timeSeriesSelectedEpic,
    fetchTimeSeriesEpic,
    fetchBasketExpressionsEpic,
);
