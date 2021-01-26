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
import { of, from, EMPTY, Observable, combineLatest } from 'rxjs';
import { getBasketInfo } from 'redux/stores/timeSeries';
import { getGenesSimilaritiesQueryGene, RootState } from 'redux/rootReducer';
import { getSelectedDifferentialExpressionGeneIds } from 'redux/stores/differentialExpressions';
import {
    associationsGenesFetchEnded,
    associationsGenesFetchStarted,
    differentialExpressionGenesFetchEnded,
    differentialExpressionGenesFetchStarted,
    genesFetchSucceeded,
    getGenesIdsInStore,
    similarGenesFetchEnded,
    similarGenesFetchStarted,
} from 'redux/stores/genes';
import { handleError } from 'utils/errorUtils';
import { BasketInfo, Gene } from 'redux/models/internal';
import { listByIds } from 'api';
import { getGenesSimilarities } from 'redux/stores/genesSimilarities';
import { fetchAssociationsGenes, fetchSelectedDifferentialExpressionGenes } from './epicsActions';
import { mapStateSlice } from './rxjsCustomFilters';

const fetchGenesActionObservable = (
    geneIds: string[],
    state: RootState,
    source?: string,
    species?: string,
): Observable<PayloadAction<Gene[]>> => {
    const geneIdsInStore = getGenesIdsInStore(state.genes);
    // Fetch only genes that aren't in redux store yet.
    const geneIdsToFetch = geneIds.filter((geneId) => !geneIdsInStore.includes(geneId));

    // If all genes in question are already in store, there's no need to fetch it again!
    if (geneIdsToFetch.length === 0) {
        return EMPTY;
    }

    const basketInfo = getBasketInfo(state.timeSeries) as BasketInfo;

    return from(
        listByIds(source ?? basketInfo.source, geneIdsToFetch, species ?? basketInfo.species),
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
                action.payload.source ?? '',
                action.payload.species ?? '',
            ).pipe(
                catchError((error) => of(handleError('Error retrieving associated genes.', error))),
                startWith(associationsGenesFetchStarted()),
                endWith(associationsGenesFetchEnded()),
            );
        }),
    );
};

const fetchSimilarGenesEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return combineLatest([
        state$.pipe(mapStateSlice((state) => getGenesSimilarities(state.genesSimilarities))),
        state$.pipe(
            mapStateSlice((state) => {
                return getGenesSimilaritiesQueryGene(state);
            }),
        ),
    ]).pipe(
        filter(([genesSimilarities]) => genesSimilarities.length > 0),
        mergeMap(([genesSimilarities, queryGene]) => {
            return fetchGenesActionObservable(
                genesSimilarities.map((geneSimilarity) => geneSimilarity.gene),
                state$.value,
                queryGene?.source,
                queryGene?.species,
            ).pipe(
                catchError((error) => of(handleError('Error retrieving similar genes.', error))),
                startWith(similarGenesFetchStarted()),
                endWith(similarGenesFetchEnded()),
            );
        }),
    );
};

export default combineEpics(
    fetchSelectedDifferentialExpressionGenesEpic,
    fetchAssociationsGenesEpic,
    fetchSimilarGenesEpic,
);
