import { ofType, Epic, combineEpics } from 'redux-observable';
import {
    map,
    mergeMap,
    startWith,
    endWith,
    catchError,
    withLatestFrom,
    delay,
} from 'rxjs/operators';
import { of, from, EMPTY, Observable } from 'rxjs';
import { getBasketInfo } from 'redux/stores/timeSeries';
import { RootState } from 'redux/rootReducer';
import { pushToSentryAndAddErrorSnackbar } from 'redux/stores/notifications';
import * as geneListApi from 'api/geneListApi';
import { getSelectedDifferentialExpressionGeneIds } from 'redux/stores/differentialExpressions';
import {
    associationsGenesFetchEnded,
    associationsGenesFetchStarted,
    differentialExpressionGenesFetchEnded,
    differentialExpressionGenesFetchStarted,
    genesFetchSucceeded,
    getGenesIdsInStore,
} from 'redux/stores/genes';
import { Gene, SnackbarNotificationContent } from 'redux/models/internal';
import { PayloadAction } from '@reduxjs/toolkit';
import { fetchAssociationsGenes, fetchSelectedDifferentialExpressionGenes } from './epicsActions';

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
): Observable<PayloadAction<Gene[]> | PayloadAction<SnackbarNotificationContent>> => {
    const geneIdsInStore = getGenesIdsInStore(state.genes);
    // Fetch only genes that aren't in redux store yet.
    const geneIdsToFetch = geneIds.filter((geneId) => !geneIdsInStore.includes(geneId));

    // If all genes in question are already in store, there's no need to fetch it again!
    if (geneIdsToFetch.length === 0) {
        return EMPTY;
    }

    const basketInfo = getBasketInfo(state.timeSeries);
    return from(
        geneListApi.listByIds(basketInfo.source, geneIdsToFetch, species ?? basketInfo.species),
    ).pipe(
        map((response) => {
            return genesFetchSucceeded(response);
        }),
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchSelectedDifferentialExpressionGenesEpic: Epic<any, any, RootState, any> = (
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
                        pushToSentryAndAddErrorSnackbar(
                            'Error retrieving genes in differential expression.',
                            error,
                        ),
                    );
                }),
                startWith(differentialExpressionGenesFetchStarted()),
                endWith(differentialExpressionGenesFetchEnded()),
            );
        }),
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchAssociationsGenesEpic: Epic<any, any, RootState, any> = (action$, state$) => {
    return action$.pipe(
        ofType(fetchAssociationsGenes),
        withLatestFrom(state$),
        mergeMap(([action, state]) => {
            return fetchGenesActionObservable(
                action.payload.geneIds,
                state,
                action.payload.species ?? '',
            ).pipe(
                catchError((error) => {
                    return of(
                        pushToSentryAndAddErrorSnackbar(
                            'Error retrieving associated genes.',
                            error,
                        ),
                    );
                }),
                startWith(associationsGenesFetchStarted()),
                endWith(associationsGenesFetchEnded()),
            );
        }),
    );
};

export default combineEpics(
    fetchSelectedDifferentialExpressionGenesEpic,
    fetchAssociationsGenesEpic,
);
