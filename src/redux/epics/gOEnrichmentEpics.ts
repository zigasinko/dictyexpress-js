import { combineLatest, of } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import { getSelectedGenes } from 'redux/stores/genes';
import { filter, switchMap } from 'rxjs/operators';
import {
    getGaf,
    getGOEnrichmentJson,
    getGOEnrichmentSource,
    getGOEnrichmentSpecies,
    getPValueThreshold,
    gOEnrichmentJsonFetchEnded,
    gOEnrichmentJsonFetchStarted,
    gOEnrichmentJsonFetchSucceeded,
} from 'redux/stores/gOEnrichment';
import { appendMissingAttributesToJson } from 'utils/gOEnrichmentUtils';
import { DataGOEnrichmentAnalysis, Storage } from '@genialis/resolwe/dist/api/types/rest';
import { gOEnrichmentDataFetchSucceeded } from './epicsActions';
import getProcessDataEpicsFactory, {
    ProcessDataEpicsFactoryProps,
    ProcessesInfo,
} from './getProcessDataEpicsFactory';
import { mapStateSlice } from './rxjsCustomFilters';

const processParametersObservable: ProcessDataEpicsFactoryProps<DataGOEnrichmentAnalysis>['processParametersObservable'] = (
    action$,
    state$,
) => {
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
                return getSelectedGenes(state.genes);
            }),
        ),
    ]).pipe(
        filter(() => getGOEnrichmentJson(state$.value.gOEnrichment) == null),
        switchMap(([gaf, pValueThreshold, selectedGenes]) => {
            if (selectedGenes.length === 0) {
                return of({});
            }

            return of({
                genes: selectedGenes.map((gene) => gene.feature_id),
                pval_threshold: pValueThreshold,
                source: selectedGenes[0].source,
                species: selectedGenes[0].species,
                ontology: 14305,
                gaf: gaf.id,
            });
        }),
    );
};

const getGOEnrichmentProcessDataEpics = getProcessDataEpicsFactory<DataGOEnrichmentAnalysis>({
    processInfo: ProcessesInfo.GOEnrichment,
    processParametersObservable,
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
});

export default getGOEnrichmentProcessDataEpics;
