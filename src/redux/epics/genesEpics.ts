import { Action, PayloadAction } from '@reduxjs/toolkit';
import { ofType, Epic, combineEpics } from 'redux-observable';
import {
    map,
    mergeMap,
    startWith,
    endWith,
    catchError,
    withLatestFrom,
    filter,
} from 'rxjs/operators';
import { of, from, EMPTY, Observable } from 'rxjs';
import { getBasketInfo } from 'redux/stores/timeSeries';
import { RootState } from 'redux/rootReducer';
import geneListApi from 'api/geneListApi';
import { getSelectedDifferentialExpressionGeneIds } from 'redux/stores/differentialExpressions';
import {
    allGenesDeselected,
    differentialExpressionGenesFetchEnded,
    differentialExpressionGenesFetchStarted,
    geneDeselected,
    genesFetchSucceeded,
    getGenesIdsInStore,
    getSelectedGenes,
} from 'redux/stores/genes';
import { handleError } from 'utils/errorUtils';
import { Gene } from 'redux/models/internal';
import { fetchSelectedDifferentialExpressionGenes } from './epicsActions';

/**
 * Function that returns observable
 * @param geneIds - IDs of genes that need to be .
 * @param state - Current redux store state.
 * @param species - If species parameter is given, use this one instead of basketInfo species to fetch the genes.
 */
const fetchGenesActionObservable = (
    geneIds: string[],
    state: RootState,
    species?: string,
): Observable<PayloadAction<Gene[]>> => {
    const geneIdsInStore = getGenesIdsInStore(state.genes);
    // Fetch only genes that aren't in redux store yet.
    const geneIdsToFetch = geneIds.filter((geneId) => !geneIdsInStore.includes(geneId));

    // If all genes in question are already in store, there's no need to fetch it again!
    if (geneIdsToFetch.length === 0) {
        return EMPTY;
    }

    const basketInfo = getBasketInfo(state.timeSeries);
    return from(
        geneListApi.listByIds(basketInfo.source, species ?? basketInfo.species, geneIdsToFetch),
    ).pipe(
        map((response) => {
            return genesFetchSucceeded(response);
        }),
    );
};

const fetchSelectedDifferentialExpressionGenesEpic: Epic<Action, Action, RootState> = (
    action$,
    state$,
) => {
    return action$.pipe(
        ofType(fetchSelectedDifferentialExpressionGenes),
        withLatestFrom(state$),
        mergeMap(([, state]) => {
            const selectedDifferentialExpressionGeneIds = getSelectedDifferentialExpressionGeneIds(
                state.differentialExpressions,
            );

            return fetchGenesActionObservable(selectedDifferentialExpressionGeneIds, state).pipe(
                catchError((error) => {
                    return of(
                        handleError('Error retrieving genes in differential expression.', error),
                    );
                }),
                startWith(differentialExpressionGenesFetchStarted()),
                endWith(differentialExpressionGenesFetchEnded()),
            );
        }),
    );
};

const geneDeselectedEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return action$.pipe(
        ofType(geneDeselected),
        withLatestFrom(state$),
        map(([, state]) => {
            return getSelectedGenes(state.genes);
        }),
        filter((selectedGenes) => selectedGenes.length === 0),
        map(allGenesDeselected),
    );
};

export default combineEpics(fetchSelectedDifferentialExpressionGenesEpic, geneDeselectedEpic);
