import { DistanceMeasure, ClusteringLinkageFunction } from 'components/genexpress/common/constants';
import _ from 'lodash';
import { mergeClusteringData } from 'redux/epics/clusteringEpics';
import { generateHierarchicalClusteringJson, generateGenesByIdPredefinedIds } from 'tests/mock';
import clusteringReducer, {
    ClusteringState,
    clusteringDistanceMeasureChanged,
    clusteringLinkageFunctionChanged,
    mergedClusteringDataFetchSucceeded,
} from './clustering';
import { allGenesDeselected, geneDeselected, genesSelected } from './genes';
import { timeSeriesSelected } from './timeSeries';

const clusteringJson = generateHierarchicalClusteringJson();
const genesById = generateGenesByIdPredefinedIds(
    _.map(clusteringJson.gene_symbols, (geneSymbol) => geneSymbol.gene),
);
const mergedClusteringData = mergeClusteringData(clusteringJson, genesById);

describe('clusteringStore store', () => {
    let initialState: ClusteringState;

    describe('empty initial state', () => {
        beforeEach(() => {
            initialState = {
                mergedData: null,
                distanceMeasure: DistanceMeasure.spearman,
                linkageFunction: ClusteringLinkageFunction.average,
                isFetchingClusteringData: false,
            };
        });

        it('should add fetched json to state with mergedClusteringDataFetchSucceeded action', () => {
            const newState = clusteringReducer(
                initialState,
                mergedClusteringDataFetchSucceeded(mergedClusteringData),
            );
            const expectedState = {
                ...initialState,
                mergedData: mergedClusteringData,
            };

            expect(newState).toEqual(expectedState);
        });

        it('should change distanceMeasure with distanceMeasureChanged action', () => {
            const newState = clusteringReducer(
                initialState,
                clusteringDistanceMeasureChanged(DistanceMeasure.pearson),
            );
            const expectedState = {
                ...initialState,
                distanceMeasure: 'pearson',
            };

            expect(newState).toEqual(expectedState);
        });

        it('should change linkageFunction with linkageFunctionChanged action', () => {
            const newState = clusteringReducer(
                initialState,
                clusteringLinkageFunctionChanged(ClusteringLinkageFunction.single),
            );
            const expectedState = {
                ...initialState,
                linkageFunction: 'single',
            };

            expect(newState).toEqual(expectedState);
        });
    });

    describe('not empty initial state', () => {
        beforeEach(() => {
            initialState = {
                mergedData: mergedClusteringData,
                distanceMeasure: DistanceMeasure.spearman,
                linkageFunction: ClusteringLinkageFunction.average,
                isFetchingClusteringData: false,
            };
        });

        it('should clear mergedData on timeSeriesSelected action', () => {
            const newState = clusteringReducer(initialState, timeSeriesSelected(1));
            const expectedState = {
                ...initialState,
                mergedData: null,
            };

            expect(newState).toEqual(expectedState);
        });

        it('should clear mergedData on allGenesDeselected action', () => {
            const newState = clusteringReducer(initialState, allGenesDeselected());
            const expectedState = {
                ...initialState,
                mergedData: null,
            };

            expect(newState).toEqual(expectedState);
        });

        it('should clear mergedData on geneDeselected action', () => {
            const newState = clusteringReducer(initialState, geneDeselected('1'));
            const expectedState = {
                ...initialState,
                mergedData: null,
            };

            expect(newState).toEqual(expectedState);
        });

        it('should clear mergedData on genesSelected action', () => {
            const newState = clusteringReducer(initialState, genesSelected(['1']));
            const expectedState = {
                ...initialState,
                mergedData: null,
            };

            expect(newState).toEqual(expectedState);
        });
    });
});
