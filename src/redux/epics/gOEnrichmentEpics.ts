import { ofType, Epic, combineEpics } from 'redux-observable';
import { map, startWith, endWith, catchError, withLatestFrom, switchMap } from 'rxjs/operators';
import { of, from } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import { geneDeselected, getSelectedGenes } from 'redux/stores/genes';
import {
    gafFetchSucceeded,
    getGaf,
    getGOEnrichmentSource,
    getGOEnrichmentSpecies,
    getPValueThreshold,
    gOEnrichmentJsonFetchEnded,
    gOEnrichmentJsonFetchStarted,
    gOEnrichmentJsonFetchSucceeded,
    pValueThresholdChanged,
} from 'redux/stores/gOEnrichment';
import { handleError } from 'utils/errorUtils';
import { Action } from '@reduxjs/toolkit';
import { appendMissingAttributesToJson } from 'utils/gOEnrichmentUtils';
import { DisposeFunction as QueryObserverDisposeFunction } from 'api/queryObserverManager';
import {
    DataGOEnrichmentAnalysis,
    DONE_DATA_STATUS,
    ERROR_DATA_STATUS,
} from '@genialis/resolwe/dist/api/types/rest';
import { getOrCreateGOEnrichmentData, getDataReactive, getStorage } from 'api';
import {
    fetchGOEnrichmentData,
    gafAlreadyFetched,
    gOEnrichmentDataFetchSucceeded,
} from './epicsActions';
import { filterNullAndUndefined } from './rxjsCustomFilters';

/* Clustering process pushes clustering data via WebSocket. If new process is started,
 * we must unsubscribe previous queryObserver. Otherwise data / errors can be displayed
 * after parameters have already changed.
 */
let activeQueryObserverDisposeFunction: QueryObserverDisposeFunction;

const getOrCreateGOEnrichmentEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return action$.pipe(
        ofType(
            gafFetchSucceeded.toString(),
            gafAlreadyFetched.toString(),
            geneDeselected.toString(),
            pValueThresholdChanged.toString(),
        ),
        withLatestFrom(state$),
        switchMap(([, state]) => {
            // Cleanup queryObserverManager existing observer waiting to receive clustering
            // data via WebSocket.
            if (activeQueryObserverDisposeFunction != null) {
                activeQueryObserverDisposeFunction();
            }

            const selectedGenes = getSelectedGenes(state.genes);

            if (selectedGenes.length === 0) {
                return of(gOEnrichmentJsonFetchEnded());
            }

            const pValueThreshold = getPValueThreshold(state.gOEnrichment);
            const gaf = getGaf(state.gOEnrichment);

            return from(
                getOrCreateGOEnrichmentData({
                    genes: selectedGenes.map((gene) => gene.feature_id),
                    pval_threshold: pValueThreshold,
                    source: selectedGenes[0].source,
                    species: selectedGenes[0].species,
                    ontology: 14305,
                    gaf: gaf.id,
                }),
            ).pipe(
                map((response) => fetchGOEnrichmentData(response.id)),
                catchError((error) =>
                    of(handleError('Error creating gene ontology enrichment process.', error)),
                ),
                startWith(gOEnrichmentJsonFetchStarted()),
            );
        }),
    );
};

/**
 * Determines if analysis was successful (throws error if not) and returns "gOEnrichmentDataFetchSucceeded"
 * action, if output terms (storageId) is not empty.
 * @param response - DataGOEnrichmentAnalysis response.
 */
const handleGOEnrichmentAnalysisDataResponse = (
    response: DataGOEnrichmentAnalysis,
): ReturnType<typeof handleError> | ReturnType<typeof gOEnrichmentDataFetchSucceeded> | null => {
    if (response.status === ERROR_DATA_STATUS) {
        const errorMessage = `Gene Ontology Enrichment analysis ended with an error ${
            response.process_error.length > 0 ? response.process_error[0] : ''
        }`;
        return handleError(errorMessage, new Error(errorMessage));
    }

    if (response.status === DONE_DATA_STATUS && response.output.terms != null) {
        return gOEnrichmentDataFetchSucceeded(response);
    }

    return null;
};

const fetchGOEnrichmentDataEpic: Epic<Action, Action, RootState> = (action$) => {
    return action$.pipe(
        ofType<Action, ReturnType<typeof fetchGOEnrichmentData>>(fetchGOEnrichmentData.toString()),
        switchMap((action) => {
            return from(
                getDataReactive(action.payload, handleGOEnrichmentAnalysisDataResponse),
            ).pipe(
                map((response) => {
                    activeQueryObserverDisposeFunction = response.disposeFunction;
                    return handleGOEnrichmentAnalysisDataResponse(response.item);
                }),
                filterNullAndUndefined(),
                catchError((error) => {
                    return of(
                        handleError(
                            'Gene Ontology Enrichment analysis ended with an error.',
                            error,
                        ),
                    );
                }),
            );
        }),
    );
};

const fetchGOEnrichmentStorageEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return action$.pipe(
        ofType<Action, ReturnType<typeof gOEnrichmentDataFetchSucceeded>>(
            gOEnrichmentDataFetchSucceeded.toString(),
        ),
        withLatestFrom(state$),
        switchMap(([action, state]) => {
            return from(getStorage(action.payload.output.terms)).pipe(
                // Save gene ontology enrichment json to redux store. Data will be extracted and displayed in
                // gOEnrichment visualization component (table).
                map((storage) => {
                    const source = getGOEnrichmentSource(state.gOEnrichment);
                    const species = getGOEnrichmentSpecies(state.gOEnrichment);
                    appendMissingAttributesToJson(storage.json, source, species);
                    return gOEnrichmentJsonFetchSucceeded(storage.json);
                }),
                catchError((error) => {
                    return of(
                        handleError('Error retrieving gene ontology enrichment storage.', error),
                    );
                }),
                endWith(gOEnrichmentJsonFetchEnded()),
            );
        }),
    );
};

export default combineEpics(
    getOrCreateGOEnrichmentEpic,
    fetchGOEnrichmentDataEpic,
    fetchGOEnrichmentStorageEpic,
);
