import { Action } from '@reduxjs/toolkit';
import { Epic, combineEpics, ofType } from 'redux-observable';
import { mergeMap, startWith, endWith, catchError } from 'rxjs/operators';
import { combineLatest, of, from, merge, EMPTY } from 'rxjs';
import { getBasketInfo } from 'redux/stores/timeSeries';
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
    differentialExpressionSelected,
} from 'redux/stores/differentialExpressions';
import { getDifferentialExpressions, getStorage } from 'api';
import {
    appStarted,
    fetchDifferentialExpressionGenes,
    loginSucceeded,
    logoutSucceeded,
} from './epicsActions';
import { filterNullAndUndefined, mapStateSlice } from './rxjsCustomFilters';

const fetchDifferentialExpressionsEpic: Epic<Action, Action, RootState> = (action$) => {
    return action$.pipe(
        ofType(appStarted.toString(), loginSucceeded.toString(), logoutSucceeded.toString()),
        mergeMap(() => {
            return from(getDifferentialExpressions()).pipe(
                mergeMap((differentialExpressions) =>
                    of(differentialExpressionsFetchSucceeded(differentialExpressions)),
                ),
                catchError((error) =>
                    of(handleError(`Error retrieving differential expressions.`, error)),
                ),
                startWith(differentialExpressionsFetchStarted()),
                endWith(differentialExpressionsFetchEnded()),
            );
        }),
    );
};

const selectDifferentialExpressionEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return combineLatest([
        state$.pipe(
            mapStateSlice((state) =>
                getStoreDifferentialExpressions(state.differentialExpressions),
            ),
        ),
        state$.pipe(
            mapStateSlice((state) => {
                return getBasketInfo(state.timeSeries);
            }),
            filterNullAndUndefined(),
        ),
    ]).pipe(
        mergeMap(([differentialExpressions, basketInfo]) => {
            if (differentialExpressions.length === 1) {
                return of(differentialExpressionSelected(differentialExpressions[0].id));
            }

            // Select differential expression for the species in the basket.
            const basketSpecies = basketInfo.species;
            if (basketSpecies != null) {
                const speciesDifferentialExpression = differentialExpressions.find(
                    (de) => de.output.species === basketSpecies,
                );
                if (speciesDifferentialExpression != null) {
                    return of(differentialExpressionSelected(speciesDifferentialExpression.id));
                }
            }

            return EMPTY;
        }),
    );
};

const fetchDifferentialExpressionsDataEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return state$.pipe(
        mapStateSlice(
            (state) => getSelectedDifferentialExpression(state.differentialExpressions),
            (selectedDifferentialExpression) => selectedDifferentialExpression?.json == null,
        ),
        filterNullAndUndefined(),
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

export default combineEpics(
    fetchDifferentialExpressionsEpic,
    fetchDifferentialExpressionsDataEpic,
    selectDifferentialExpressionEpic,
);
