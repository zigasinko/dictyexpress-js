import { ofType, Epic, combineEpics } from 'redux-observable';
import { map, mergeMap, startWith, endWith, catchError, withLatestFrom } from 'rxjs/operators';
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
import {
    getDataFetchSucceededActionIfDone,
    getGOEnrichmentData,
    getOrCreateGOEnrichmentData,
    getStorageJson,
} from 'api';
import {
    fetchGOEnrichmentData,
    gafAlreadyFetched,
    gOEnrichmentDataFetchSucceeded,
} from './epicsActions';
import { filterNullAndUndefined } from './rxjsCustomFilters';

const getOrCreateGOEnrichmentEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return action$.pipe(
        ofType(
            gafFetchSucceeded.toString(),
            gafAlreadyFetched.toString(),
            geneDeselected.toString(),
            pValueThresholdChanged.toString(),
        ),
        withLatestFrom(state$),
        mergeMap(([, state]) => {
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

const fetchGOEnrichmentDataEpic: Epic<Action, Action, RootState> = (action$) => {
    return action$.pipe(
        ofType<Action, ReturnType<typeof fetchGOEnrichmentData>>(fetchGOEnrichmentData.toString()),
        mergeMap((action) => {
            return from(getGOEnrichmentData(action.payload)).pipe(
                map((response) => {
                    return getDataFetchSucceededActionIfDone(response);
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
        mergeMap(([action, state]) => {
            return from(getStorageJson(action.payload.output.terms)).pipe(
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
