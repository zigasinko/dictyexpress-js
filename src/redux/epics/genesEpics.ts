import {
    Action,
    ActionCreatorWithoutPayload,
    ActionCreatorWithPayload,
    PayloadAction,
} from '@reduxjs/toolkit';
import { Epic, combineEpics } from 'redux-observable';
import {
    map,
    mergeMap,
    startWith,
    endWith,
    catchError,
    withLatestFrom,
    filter,
    switchMap,
    first,
} from 'rxjs/operators';
import { of, from, EMPTY, Observable, merge } from 'rxjs';
import { getBasketInfo } from 'redux/stores/timeSeries';
import { getGenesSimilaritiesQueryGene, RootState } from 'redux/rootReducer';
import {
    associationsGenesFetchEnded,
    associationsGenesFetchStarted,
    bookmarkedGenesFetchEnded,
    bookmarkedGenesFetchStarted,
    differentialExpressionGenesFetchEnded,
    differentialExpressionGenesFetchStarted,
    genesFetchSucceeded,
    genesSelected,
    getGenesIdsInStore,
    similarGenesFetchEnded,
    similarGenesFetchStarted,
} from 'redux/stores/genes';
import { handleError } from 'utils/errorUtils';
import { BasketInfo, Gene } from 'redux/models/internal';
import { listByIds } from 'api';
import { getGenesSimilarities } from 'redux/stores/genesSimilarities';
import { mapStateSlice } from './rxjsCustomFilters';
import {
    fetchAssociationsGenes,
    fetchAndSelectPredefinedGenes,
    fetchDifferentialExpressionGenes,
    TFetchGenesActionPayload,
} from './epicsActions';

const fetchGenesActionObservable = (
    geneIds: string[],
    state: RootState,
    source?: string,
    species?: string,
): Observable<PayloadAction<Gene[]>> => {
    const geneIdsInStore = getGenesIdsInStore(state.genes);
    // Fetch only genes that aren't in redux store yet.
    const geneIdsToFetch = geneIds.filter((geneId) => !geneIdsInStore.includes(geneId));

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

const fetchGenesEpicsFactory = (
    fetchGenesAction: ActionCreatorWithPayload<TFetchGenesActionPayload, string>,
    startWithActionCreator: ActionCreatorWithoutPayload,
    endWithActionCreator: ActionCreatorWithoutPayload,
    errorMessage = 'Error retrieving genes.',
): Epic<Action, Action, RootState> => {
    return (action$, state$): Observable<Action> => {
        return action$.pipe(
            filter(fetchGenesAction.match),
            withLatestFrom(state$),
            mergeMap(([action, state]) => {
                return fetchGenesActionObservable(
                    action.payload.geneIds,
                    state,
                    action.payload.source,
                    action.payload.species,
                ).pipe(
                    catchError((error) => of(handleError(errorMessage, error))),
                    startWith(startWithActionCreator()),
                    endWith(endWithActionCreator()),
                );
            }),
        );
    };
};

const fetchSelectedDifferentialExpressionGenesEpic = fetchGenesEpicsFactory(
    fetchDifferentialExpressionGenes,
    differentialExpressionGenesFetchStarted,
    differentialExpressionGenesFetchEnded,
    'Error retrieving genes in differential expression.',
);

const fetchAssociationsGenesEpic = fetchGenesEpicsFactory(
    fetchAssociationsGenes,
    associationsGenesFetchStarted,
    associationsGenesFetchEnded,
    'Error retrieving associated genes.',
);

const fetchPredefinedGenesEpic: Epic<Action, Action, RootState> = (action$, state$) =>
    action$.pipe(
        filter(fetchAndSelectPredefinedGenes.match),
        switchMap((action) => {
            return state$.pipe(
                mapStateSlice((state) => getBasketInfo(state.timeSeries)),
                first(),
                switchMap((basketInfo) => {
                    return merge(
                        fetchGenesActionObservable(
                            action.payload.geneIds,
                            state$.value,
                            basketInfo.source,
                            basketInfo.species,
                        ),
                        of(genesSelected(action.payload.geneIds)),
                    ).pipe(
                        catchError((error) =>
                            of(handleError('Error retrieving predefined genes.', error)),
                        ),
                        startWith(bookmarkedGenesFetchStarted()),
                        endWith(bookmarkedGenesFetchEnded()),
                    );
                }),
            );
        }),
    );

const fetchSimilarGenesEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return state$.pipe(
        mapStateSlice((state) => getGenesSimilarities(state.genesSimilarities)),
        filter((genesSimilarities) => genesSimilarities.length > 0),
        withLatestFrom(state$),
        mergeMap(([genesSimilarities, state]) => {
            const queryGene = getGenesSimilaritiesQueryGene(state);
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
    fetchPredefinedGenesEpic,
);
