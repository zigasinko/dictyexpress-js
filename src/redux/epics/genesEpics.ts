import { createAction } from '@reduxjs/toolkit';
import { ofType, Epic } from 'redux-observable';
import { map, mergeMap, startWith, endWith, catchError, withLatestFrom } from 'rxjs/operators';
import { of, from, EMPTY } from 'rxjs';
import { getBasketInfo } from 'redux/stores/timeSeries';
import { RootState } from 'redux/rootReducer';
import { pushToSentryAndAddErrorSnackbar } from 'redux/stores/notifications';
import * as geneListApi from 'api/geneListApi';
import { getSelectedDifferentialExpressionGeneIds } from 'redux/stores/differentialExpressions';
import {
    differentialExpressionGenesFetchEnded,
    differentialExpressionGenesFetchStarted,
    genesFetchSucceeded,
    getGenesIdsInStore,
} from 'redux/stores/genes';

// Export epic actions.
export const fetchSelectedDifferentialExpressionGenes = createAction(
    'genes/fetchSelectedDifferentialExpressionGenes',
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchSelectedDifferentialExpressionGenesEpic: Epic<any, any, RootState, any> = (
    action$,
    state$,
) => {
    return action$.pipe(
        ofType(fetchSelectedDifferentialExpressionGenes.toString()),
        withLatestFrom(state$),
        mergeMap(([, state]) => {
            const selectedDifferentialExpressionGeneIds = getSelectedDifferentialExpressionGeneIds(
                state.differentialExpressions,
            );
            const geneIdsInStore = getGenesIdsInStore(state.genes);

            // Fetch only genes that aren't in redux store yet.
            const geneIdsToFetch = selectedDifferentialExpressionGeneIds.filter(
                (geneId) => !geneIdsInStore.includes(geneId),
            );

            // If all genes in question are already in store, there's no need to fetch it again!
            if (geneIdsToFetch.length === 0) {
                return EMPTY;
            }

            const basketInfo = getBasketInfo(state.timeSeries);
            return from(
                geneListApi.listByIds(basketInfo.source, basketInfo.species, geneIdsToFetch),
            ).pipe(
                map((response) => genesFetchSucceeded(response)),
                catchError((error) =>
                    of(
                        pushToSentryAndAddErrorSnackbar(
                            `Error retrieving genes in differential expression. `,
                            error,
                        ),
                    ),
                ),
                startWith(differentialExpressionGenesFetchStarted()),
                endWith(differentialExpressionGenesFetchEnded()),
            );
        }),
    );
};
