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
import { getSelectedDifferentialExpressionGeneIds } from 'redux/stores/differentialExpressions';
import {
    allGenesDeselected,
    associationsGenesFetchEnded,
    associationsGenesFetchStarted,
    differentialExpressionGenesFetchEnded,
    differentialExpressionGenesFetchStarted,
    geneDeselected,
    genesFetchSucceeded,
    getGenesIdsInStore,
    getSelectedGenes,
} from 'redux/stores/genes';
import { handleError } from 'utils/errorUtils';
import { Gene } from 'redux/models/internal';
import { listByIds } from 'api';
import { fetchAssociationsGenes, fetchSelectedDifferentialExpressionGenes } from './epicsActions';

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
    return from(listByIds(basketInfo.source, geneIdsToFetch, species ?? basketInfo.species)).pipe(
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

const fetchAssociationsGenesEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return action$.pipe(
        ofType<Action, ReturnType<typeof fetchAssociationsGenes>>(
            fetchAssociationsGenes.toString(),
        ),
        withLatestFrom(state$),
        mergeMap(([action, state]) => {
            return fetchGenesActionObservable(
                action.payload.geneIds,
                state,
                action.payload.species ?? '',
            ).pipe(
                catchError((error) => of(handleError('Error retrieving associated genes.', error))),
                startWith(associationsGenesFetchStarted()),
                endWith(associationsGenesFetchEnded()),
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

export default combineEpics(
    fetchSelectedDifferentialExpressionGenesEpic,
    fetchAssociationsGenesEpic,
    geneDeselectedEpic,
);
