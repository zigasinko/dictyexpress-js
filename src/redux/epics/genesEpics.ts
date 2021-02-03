import {
    Action,
    ActionCreatorWithoutPayload,
    ActionCreatorWithPayload,
    PayloadAction,
} from '@reduxjs/toolkit';
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
import {
    associationsGenesFetchEnded,
    associationsGenesFetchStarted,
    bookmarkedGenesFetchEnded,
    bookmarkedGenesFetchStarted,
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
import { mapStateSlice } from './rxjsCustomFilters';
import {
    fetchAssociationsGenes,
    fetchBookmarkedGenes,
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
            ofType<Action, ReturnType<ActionCreatorWithPayload<TFetchGenesActionPayload, string>>>(
                fetchGenesAction.toString(),
            ),
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

const fetchBookmarkedGenesEpic = fetchGenesEpicsFactory(
    fetchBookmarkedGenes,
    bookmarkedGenesFetchStarted,
    bookmarkedGenesFetchEnded,
    'Error retrieving bookmarked genes.',
);

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
    fetchBookmarkedGenesEpic,
);
