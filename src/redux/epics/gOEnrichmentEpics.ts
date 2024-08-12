import { combineLatest, of } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { DataGOEnrichmentAnalysis, Storage } from '@genialis/resolwe/dist/api/types/rest';
import { fetchGOEnrichmentData, gOEnrichmentDataFetchSucceeded } from './epicsActions';
import getProcessDataEpicsFactory, {
    ProcessDataEpicsFactoryProps,
    ProcessesInfo,
} from './getProcessDataEpicsFactory';
import { filterNullAndUndefined, mapStateSlice } from './rxjsCustomFilters';
import { appendMissingAttributesToJson } from 'utils/gOEnrichmentUtils';
import {
    getGaf,
    getGOEnrichmentJson,
    getGOEnrichmentSource,
    getGOEnrichmentSpecies,
    getOntologyObo,
    getPValueThreshold,
    gOEnrichmentJsonFetchEnded,
    gOEnrichmentJsonFetchStarted,
    gOEnrichmentJsonFetchSucceeded,
    gOEnrichmentStatusUpdated,
} from 'redux/stores/gOEnrichment';
import { getSelectedGenesSortedById } from 'redux/stores/genes';
import { RootState } from 'redux/rootReducer';

const processParametersObservable: ProcessDataEpicsFactoryProps<DataGOEnrichmentAnalysis>['processParametersObservable'] =
    (_action$, state$) => {
        return combineLatest([
            state$.pipe(
                mapStateSlice((state) => {
                    return getGaf(state.gOEnrichment);
                }),
            ),
            state$.pipe(
                mapStateSlice((state) => {
                    return getPValueThreshold(state.gOEnrichment);
                }),
            ),
            state$.pipe(
                mapStateSlice((state) => {
                    return getSelectedGenesSortedById(state.genes);
                }),
            ),
            state$.pipe(
                mapStateSlice((state) => {
                    return getOntologyObo(state.gOEnrichment);
                }),
                filterNullAndUndefined(),
            ),
        ]).pipe(
            filter(() => getGOEnrichmentJson(state$.value.gOEnrichment) == null),
            switchMap(([gaf, pValueThreshold, selectedGenes, ontologyObo]) => {
                if (gaf == null || selectedGenes.length === 0) {
                    return of({});
                }

                return of({
                    genes: selectedGenes.map((gene) => gene.feature_id),
                    pval_threshold: pValueThreshold,
                    source: selectedGenes[0].source,
                    species: selectedGenes[0].species,
                    ontology: ontologyObo.id,
                    gaf: gaf.id,
                });
            }),
        );
    };

const getGOEnrichmentProcessDataEpics = getProcessDataEpicsFactory<DataGOEnrichmentAnalysis>({
    processInfo: ProcessesInfo.GOEnrichment,
    processParametersObservable,
    fetchDataActionCreator: fetchGOEnrichmentData,
    processStartedActionCreator: gOEnrichmentJsonFetchStarted,
    processEndedActionCreator: gOEnrichmentJsonFetchEnded,
    fetchDataSucceededActionCreator: gOEnrichmentDataFetchSucceeded,
    getStorageIdFromData: (data: DataGOEnrichmentAnalysis) => {
        return data.output.terms;
    },
    actionFromStorageResponse: (storage: Storage, state: RootState) => {
        // Save gene ontology enrichment json to redux store. Data will be extracted and displayed in
        // gOEnrichment visualization component (table).
        const source = getGOEnrichmentSource(state.gOEnrichment);
        const species = getGOEnrichmentSpecies(state.gOEnrichment);
        appendMissingAttributesToJson(storage.json, source, species);
        return gOEnrichmentJsonFetchSucceeded(storage.json);
    },
    actionFromStatusUpdate: (status) => gOEnrichmentStatusUpdated(status),
});

export default getGOEnrichmentProcessDataEpics;
