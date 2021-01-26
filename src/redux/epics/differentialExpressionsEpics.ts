import { Action } from '@reduxjs/toolkit';
import { Epic, combineEpics } from 'redux-observable';
import { map, mergeMap, startWith, endWith, catchError } from 'rxjs/operators';
import { of, from, merge } from 'rxjs';
import { getBasketId } from 'redux/stores/timeSeries';
import { RootState } from 'redux/rootReducer';
import { handleError } from 'utils/errorUtils';
import {
    differentialExpressionsDataFetchEnded,
    differentialExpressionsDataFetchStarted,
    differentialExpressionsFetchEnded,
    differentialExpressionsFetchStarted,
    differentialExpressionsFetchSucceeded,
    differentialExpressionStorageFetchSucceeded,
    getSelectedDifferentialExpression,
    getDifferentialExpressions as getStoreDifferentialExpressions,
} from 'redux/stores/differentialExpressions';
import { getDifferentialExpressions, getStorage } from 'api';
import { fetchDifferentialExpressionGenes } from './epicsActions';
import { mapStateSlice } from './rxjsCustomFilters';

const fetchDifferentialExpressionsEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return state$.pipe(
        mapStateSlice(
            (state) => getBasketId(state.timeSeries),
            () =>
                getStoreDifferentialExpressions(state$.value.differentialExpressions).length === 0,
        ),
        mergeMap((basketId) => {
            return from(getDifferentialExpressions(basketId)).pipe(
                map((differentialExpressions) => {
                    return differentialExpressionsFetchSucceeded(differentialExpressions);
                }),
                catchError((error) =>
                    of(handleError(`Error retrieving differential expressions.`, error)),
                ),
                startWith(differentialExpressionsFetchStarted()),
                endWith(differentialExpressionsFetchEnded()),
            );
        }),
    );
};

const fetchDifferentialExpressionsDataEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return state$.pipe(
        mapStateSlice(
            (state) => getSelectedDifferentialExpression(state.differentialExpressions),
            (selectedDifferentialExpression) => selectedDifferentialExpression.json == null,
        ),
        mergeMap((selectedDifferentialExpression) => {
            return from(getStorage(selectedDifferentialExpression.output.de_json)).pipe(
                mergeMap((storage) => {
                    // Save differentialExpression module response json in redux store. Data will be extracted and displayed in
                    // differentialExpressions visualization component.
                    return merge(
                        of(differentialExpressionStorageFetchSucceeded(storage)),
                        of(
                            fetchDifferentialExpressionGenes({
                                geneIds: storage.json.gene_id,
                            }),
                        ),
                    );
                }),
                catchError((error) =>
                    of(
                        handleError(
                            `Error retrieving differential expressions storage data.`,
                            error,
                        ),
                    ),
                ),
                startWith(differentialExpressionsDataFetchStarted()),
                endWith(differentialExpressionsDataFetchEnded()),
            );
        }),
    );
};

export default combineEpics(fetchDifferentialExpressionsEpic, fetchDifferentialExpressionsDataEpic);
