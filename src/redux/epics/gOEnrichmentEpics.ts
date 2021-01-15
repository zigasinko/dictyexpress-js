import { of } from 'rxjs';
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
import { appendMissingAttributesToJson } from 'utils/gOEnrichmentUtils';
import { DataGOEnrichmentAnalysis, Storage } from '@genialis/resolwe/dist/api/types/rest';
import {
    fetchGOEnrichmentData,
    gafAlreadyFetched,
    gOEnrichmentDataFetchSucceeded,
} from './epicsActions';
import getOrCreateProcessDataEpics, { ProcessesInfo } from './getProcessDataEpicsFactory';

const getGOEnrichmentProcessDataEpics = getOrCreateProcessDataEpics<DataGOEnrichmentAnalysis>({
    processInfo: ProcessesInfo.GOEnrichment,
    inputActions: [
        gafFetchSucceeded.toString(),
        gafAlreadyFetched.toString(),
        geneDeselected.toString(),
        pValueThresholdChanged.toString(),
    ],
    getGetOrCreateInput: (state: RootState) => {
        const selectedGenes = getSelectedGenes(state.genes);

        if (selectedGenes.length === 0) {
            return of(gOEnrichmentJsonFetchEnded());
        }

        const pValueThreshold = getPValueThreshold(state.gOEnrichment);
        const gaf = getGaf(state.gOEnrichment);

        return {
            genes: selectedGenes.map((gene) => gene.feature_id),
            pval_threshold: pValueThreshold,
            source: selectedGenes[0].source,
            species: selectedGenes[0].species,
            ontology: 14305,
            gaf: gaf.id,
        };
    },
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
});

export default getGOEnrichmentProcessDataEpics;
