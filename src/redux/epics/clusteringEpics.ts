import { ofType, Epic, combineEpics } from 'redux-observable';
import {
    map,
    startWith,
    endWith,
    catchError,
    withLatestFrom,
    switchMap,
    mergeMap,
} from 'rxjs/operators';
import { of, from, EMPTY, merge, Observable } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import {
    allGenesDeselected,
    geneDeselected,
    genesSelected,
    getGenesById,
    getSelectedGenes,
} from 'redux/stores/genes';
import { handleError } from 'utils/errorUtils';
import { Action } from '@reduxjs/toolkit';
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
import {
    DONE_DATA_STATUS,
    ERROR_DATA_STATUS,
    GeneClustering,
} from '@genialis/resolwe/dist/api/types/rest';
import { DisposeFunction as QueryObserverDisposeFunction } from 'api/queryObserverManager';
import { ClusteringData } from 'redux/models/rest';
import { getDataReactive, getOrCreateClusteringData, getStorage } from 'api';
import { fetchClusteringData, fetchClusteringStorage } from './epicsActions';
import { filterNullAndUndefined } from './rxjsCustomFilters';

/* Clustering process pushes clustering data via WebSocket. If new process is started,
 * we must unsubscribe previous queryObserver. Otherwise data / errors can be displayed
 * after parameters have already changed.
 */
let activeQueryObserverDisposeFunction: QueryObserverDisposeFunction;

const getOrCreateClusteringEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return action$.pipe(
        ofType(
            fetchBasketExpressionsIdsSucceeded.toString(),
            genesSelected.toString(),
            geneDeselected.toString(),
            allGenesDeselected.toString(),
            distanceMeasureChanged.toString(),
            linkageFunctionChanged.toString(),
        ),
        withLatestFrom(state$),
        switchMap(([, state]) => {
            // Cleanup queryObserverManager existing observer waiting to receive clustering
            // data via WebSocket.
            if (activeQueryObserverDisposeFunction != null) {
                activeQueryObserverDisposeFunction();
            }

            const expressionsIds = getBasketExpressionsIds(state.timeSeries);
            const selectedGenes = getSelectedGenes(state.genes);
            const distanceMeasure = getDistanceMeasure(state.clustering);
            const linkage = getLinkageFunction(state.clustering);

            // The {Pearson/Spearman} correlation between genes must be computed on at least
            // two genes.
            if (selectedGenes.length < 2) {
                return of(clusteringDataFetchEnded());
            }

            // If basket expressions aren't in store yet, hierarchical clustering can't be
            // computed.
            if (expressionsIds.length === 0) {
                return of(clusteringDataFetchEnded());
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

            return from(
                getOrCreateClusteringData({
                    expressions: _.sortBy(expressionsIds),
                    ...(!_.isEmpty(selectedGenes) && {
                        genes: _.sortBy(_.map(selectedGenes, (gene) => gene.feature_id)),
                        gene_source: source,
                        gene_species: species,
                    }),
                    distance: distanceMeasure,
                    linkage,
                    ordering: true,
                }),
            ).pipe(
                map((response) => fetchClusteringData(response.id)),
                catchError((error) => {
                    return merge(
                        of(handleError('Error creating hierarchical clustering process.', error)),
                        of(clusteringDataFetchEnded()),
                    );
                }),
                startWith(clusteringDataFetchStarted()),
            );
        }),
        filterNullAndUndefined(),
    );
};

/**
 * Determines if analysis was successful (throws error if not) and returns Observable with
 * "fetchGOEnrichmentStorage" action, if output terms (storageId) is not empty.
 * @param response - ClusteringData response.
 */
const handleClusteringDataResponse = (
    response: ClusteringData,
): Observable<
    | ReturnType<typeof handleError>
    | ReturnType<typeof fetchClusteringStorage>
    | ReturnType<typeof clusteringDataFetchEnded>
    | never
> => {
    if (response.status === ERROR_DATA_STATUS) {
        const errorMessage = `Hierarchical Clustering analysis ended with an error ${
            response.process_error.length > 0 ? response.process_error[0] : ''
        }`;
        return merge(
            of(handleError(errorMessage, new Error(errorMessage))),
            of(clusteringDataFetchEnded()),
        );
    }

    if (response.status === DONE_DATA_STATUS && response.output.cluster != null) {
        return of(fetchClusteringStorage(response.output.cluster));
    }

    return EMPTY;
};

const fetchClusteringDataEpic: Epic<Action, Action, RootState> = (action$) => {
    return action$.pipe(
        ofType<Action, ReturnType<typeof fetchClusteringData>>(fetchClusteringData.toString()),
        switchMap((action) => {
            return from(getDataReactive(action.payload, handleClusteringDataResponse)).pipe(
                mergeMap((response) => {
                    activeQueryObserverDisposeFunction = response.disposeFunction;
                    return handleClusteringDataResponse(response.item);
                }),
                catchError((error) => {
                    return merge(
                        of(
                            handleError(
                                'Hierarchical clustering analysis ended with an error.',
                                error,
                            ),
                        ),
                        of(clusteringDataFetchEnded()),
                    );
                }),
                filterNullAndUndefined(),
            );
        }),
    );
};

/**
 * Transforms hierarchical clustering response with gene data and linkage nodes
 * indexes.
 * @param clustering - GeneClustering returned from backend (in storage.json).
 * @param genesById - GenesById (from redux store).
 */
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

const fetchClusteringStorageEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return action$.pipe(
        ofType<Action, ReturnType<typeof fetchClusteringStorage>>(
            fetchClusteringStorage.toString(),
        ),
        withLatestFrom(state$),
        switchMap(([action, state]) => {
            return from(getStorage(action.payload)).pipe(
                map((storage) =>
                    mergedClusteringDataFetchSucceeded(
                        mergeClusteringData(storage.json, getGenesById(state.genes)),
                    ),
                ),
                catchError((error) => {
                    return of(
                        handleError('Error retrieving hierarchical clustering storage.', error),
                    );
                }),
                endWith(clusteringDataFetchEnded()),
            );
        }),
    );
};

export default combineEpics(
    getOrCreateClusteringEpic,
    fetchClusteringDataEpic,
    fetchClusteringStorageEpic,
);
