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
import { of, from, EMPTY } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import { pushToSentryAndAddErrorSnackbar } from 'redux/stores/notifications';
import * as getOrCreateApi from 'api/getOrCreateApi';
import * as dataApi from 'api/dataApi';
import * as storageApi from 'api/storageApi';
import { getSelectedGenes } from 'redux/stores/genes';
import {
    gafFetchSucceeded,
    getGaf,
    getGOEnrichmentSource,
    getGOEnrichmentSpecies,
    getPValueThreshold,
    gOEnrichmentDataFetchSucceeded,
    gOEnrichmentJsonFetchEnded,
    gOEnrichmentJsonFetchStarted,
    gOEnrichmentJsonFetchSucceeded,
    pValueThresholdChanged,
} from 'redux/stores/gOEnrichment';
import { appendMissingAttributesToJson } from 'components/genexpress/modules/gOEnrichment/gOEnrichmentUtils';
import { fetchGOEnrichmentData } from './epicsActions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getOrCreateGOEnrichmentEpic: Epic<any, any, RootState, any> = (action$, state$) => {
    return action$.pipe(
        ofType(gafFetchSucceeded.toString(), pValueThresholdChanged.toString()),
        withLatestFrom(state$),
        mergeMap(([, state]) => {
            const selectedGenes = getSelectedGenes(state.genes);

            if (selectedGenes.length === 0) {
                return EMPTY;
            }

            const pValueThreshold = getPValueThreshold(state.gOEnrichment);
            const gaf = getGaf(state.gOEnrichment);

            return from(
                getOrCreateApi.getOrCreateGOEnrichmentData({
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
                    of(
                        pushToSentryAndAddErrorSnackbar(
                            'Error creating gene ontology enrichment process.',
                            error,
                        ),
                    ),
                ),
                startWith(gOEnrichmentJsonFetchStarted()),
            );
        }),
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchGOEnrichmentDataEpic: Epic<any, any, RootState, any> = (action$) => {
    return action$.pipe(
        ofType(fetchGOEnrichmentData),
        mergeMap((action) => {
            return from(dataApi.getGOEnrichmentData(action.payload)).pipe(
                map((response) => {
                    return dataApi.handleGOEnrichmentDataResponse(response);
                }),
                filter((outputAction) => outputAction != null),
                catchError((error) => {
                    return of(
                        pushToSentryAndAddErrorSnackbar(
                            'Gene Ontology Enrichment analysis ended with an error.',
                            error,
                        ),
                    );
                }),
            );
        }),
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchGOEnrichmentStorageEpic: Epic<any, any, RootState, any> = (action$, state$) => {
    return action$.pipe(
        ofType(gOEnrichmentDataFetchSucceeded),
        withLatestFrom(state$),
        mergeMap(([action, state]) => {
            return from(storageApi.getStorageJson(action.payload.output.terms)).pipe(
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
                        pushToSentryAndAddErrorSnackbar(
                            'Error retrieving gene ontology enrichment storage.',
                            error,
                        ),
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
