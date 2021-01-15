import { of } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import {
    allGenesDeselected,
    geneDeselected,
    genesSelected,
    getGenesById,
    getSelectedGenes,
} from 'redux/stores/genes';
import { handleError } from 'utils/errorUtils';
import _ from 'lodash';
import {
    fetchBasketExpressionsIdsSucceeded,
    getBasketExpressionsIds,
} from 'redux/stores/timeSeries';
import {
    clusteringDataFetchEnded,
    clusteringDataFetchStarted,
    mergedClusteringDataFetchSucceeded,
    distanceMeasureChanged,
    getDistanceMeasure,
    getLinkageFunction,
    linkageFunctionChanged,
} from 'redux/stores/clustering';
import {
    getSourceFromFeatures,
    getSpeciesFromFeatures,
} from '@genialis/resolwe/dist/api/types/utils';
import { GenesById, MergedClusteringData } from 'redux/models/internal';
import { Feature } from '@genialis/resolwe/dist/api/types/modules';
import { GeneClustering, Storage } from '@genialis/resolwe/dist/api/types/rest';
import { ClusteringData } from 'redux/models/rest';
import { fetchClusteringData, fetchClusteringDataSucceeded } from './epicsActions';
import getProcessDataEpicsFactory, { ProcessesInfo } from './getProcessDataEpicsFactory';

export const mergeClusteringData = (
    clustering: GeneClustering,
    genesById: GenesById,
): MergedClusteringData => {
    return {
        order: _.map(clustering.order, (nodeIndex, order) => {
            const gene = genesById[clustering.gene_symbols[nodeIndex].gene];
            return { nodeIndex, order, gene };
        }),
        linkage: _.map(clustering.linkage, ([node1, node2, distance], arrIndex) => {
            return { nodeIndex: arrIndex + clustering.order.length, node1, node2, distance };
        }),
    };
};

const getClusteringProcessDataEpics = getProcessDataEpicsFactory<ClusteringData>({
    processInfo: ProcessesInfo.HierarchicalClustering,
    inputActions: [
        fetchBasketExpressionsIdsSucceeded.toString(),
        genesSelected.toString(),
        geneDeselected.toString(),
        allGenesDeselected.toString(),
        distanceMeasureChanged.toString(),
        linkageFunctionChanged.toString(),
    ],
    getGetOrCreateInput: (state: RootState) => {
        const expressionsIds = getBasketExpressionsIds(state.timeSeries);
        const selectedGenes = getSelectedGenes(state.genes);
        const distanceMeasure = getDistanceMeasure(state.clustering);
        const linkage = getLinkageFunction(state.clustering);

        // The {Pearson/Spearman} correlation between genes must be computed on at least
        // two genes.
        if (selectedGenes.length < 2) {
            return {};
        }

        // If basket expressions aren't in store yet, hierarchical clustering can't be
        // computed.
        if (expressionsIds.length === 0) {
            return {};
        }

        let source;
        let species;
        try {
            source = getSourceFromFeatures(selectedGenes as Feature[]);
            species = getSpeciesFromFeatures(selectedGenes as Feature[]);
        } catch (error) {
            return of(
                handleError(
                    `Error creating hierarchical clustering process: ${error.message}`,
                    error,
                ),
            );
        }

        return {
            expressions: _.sortBy(expressionsIds),
            ...(!_.isEmpty(selectedGenes) && {
                genes: _.sortBy(_.map(selectedGenes, (gene) => gene.feature_id)),
                gene_source: source,
                gene_species: species,
            }),
            distance: distanceMeasure,
            linkage,
            ordering: true,
        };
    },
    fetchDataActionCreator: fetchClusteringData,
    processStartedActionCreator: clusteringDataFetchStarted,
    processEndedActionCreator: clusteringDataFetchEnded,
    fetchDataSucceededActionCreator: fetchClusteringDataSucceeded,
    getStorageIdFromData: (data) => {
        return data.output.cluster;
    },
    actionFromStorageResponse: (storage: Storage, state: RootState) =>
        mergedClusteringDataFetchSucceeded(
            mergeClusteringData(storage.json, getGenesById(state.genes)),
        ),
});

export default getClusteringProcessDataEpics;
