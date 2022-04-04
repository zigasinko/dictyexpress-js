import { combineLatest, of } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import { getGenesById, getSelectedGenes } from 'redux/stores/genes';
import { handleError } from 'utils/errorUtils';
import _ from 'lodash';
import { getBasketExpressionsIds } from 'redux/stores/timeSeries';
import {
    clusteringDataFetchEnded,
    clusteringDataFetchStarted,
    mergedClusteringDataFetchSucceeded,
    getClusteringDistanceMeasure,
    getClusteringLinkageFunction,
    getMergedClusteringData,
    clusteringStatusUpdated,
} from 'redux/stores/clustering';
import {
    getSourceFromFeatures,
    getSpeciesFromFeatures,
} from '@genialis/resolwe/dist/api/types/utils';
import { GenesById, MergedClusteringData } from 'redux/models/internal';
import { Feature } from '@genialis/resolwe/dist/api/types/modules';
import { DataStatus, GeneClustering, Storage } from '@genialis/resolwe/dist/api/types/rest';
import { ClusteringData } from 'redux/models/rest';
import { filter, switchMap } from 'rxjs/operators';
import { fetchClusteringData, fetchClusteringDataSucceeded } from './epicsActions';
import getProcessDataEpicsFactory, {
    ProcessDataEpicsFactoryProps,
    ProcessesInfo,
} from './getProcessDataEpicsFactory';
import { mapStateSlice } from './rxjsCustomFilters';

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

const processParametersObservable: ProcessDataEpicsFactoryProps<ClusteringData>['processParametersObservable'] =
    (_action$, state$) => {
        return combineLatest([
            state$.pipe(
                mapStateSlice((state) => {
                    return getBasketExpressionsIds(state.timeSeries);
                }),
            ),
            state$.pipe(
                mapStateSlice((state) => {
                    return getSelectedGenes(state.genes);
                }),
            ),
            state$.pipe(
                mapStateSlice((state) => {
                    return getClusteringDistanceMeasure(state.clustering);
                }),
            ),
            state$.pipe(
                mapStateSlice((state) => {
                    return getClusteringLinkageFunction(state.clustering);
                }),
            ),
        ]).pipe(
            filter(() => getMergedClusteringData(state$.value.clustering) == null),
            switchMap(([expressionsIds, selectedGenes, distanceMeasure, linkageFunction]) => {
                // The {Pearson/Spearman} correlation between genes must be computed on at least
                // two genes.
                if (selectedGenes.length < 2) {
                    return of({});
                }

                // If basket expressions aren't in store yet, hierarchical clustering can't be
                // computed.
                if (expressionsIds.length === 0) {
                    return of({});
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

                return of({
                    expressions: _.sortBy(expressionsIds),
                    ...(!_.isEmpty(selectedGenes) && {
                        genes: _.sortBy(_.map(selectedGenes, (gene) => gene.feature_id)),
                        gene_source: source,
                        gene_species: species,
                    }),
                    distance: distanceMeasure,
                    linkage: linkageFunction,
                    ordering: true,
                });
            }),
        );
    };

const getClusteringProcessDataEpics = getProcessDataEpicsFactory<ClusteringData>({
    processInfo: ProcessesInfo.HierarchicalClustering,
    processParametersObservable,
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
    actionFromStatusUpdate: (status: DataStatus | null) => clusteringStatusUpdated(status),
});

export default getClusteringProcessDataEpics;
