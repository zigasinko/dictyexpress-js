import { RootState } from 'redux/rootReducer';
import { getSelectedGenesIds } from 'redux/stores/genes';
import _ from 'lodash';
import { getBasketExpressionsIds } from 'redux/stores/timeSeries';
import { Storage } from '@genialis/resolwe/dist/api/types/rest';
import { FindSimilarGenesData } from 'redux/models/rest';
import {
    getGenesSimilaritiesDistanceMeasure,
    getGenesSimilarities,
    getGenesSimilaritiesQueryGeneId,
    genesSimilaritiesFetchEnded,
    genesSimilaritiesFetchStarted,
    genesSimilaritiesFetchSucceeded,
    genesSimilaritiesQueryGeneSet,
} from 'redux/stores/genesSimilarities';
import { combineEpics, Epic, ofType } from 'redux-observable';
import { filter, map, switchMap } from 'rxjs/operators';
import { Action } from '@reduxjs/toolkit';
import { combineLatest, of } from 'rxjs';
import {
    fetchGenesSimilarities,
    fetchGenesSimilaritiesData,
    fetchGenesSimilaritiesDataSucceeded,
} from './epicsActions';
import getProcessDataEpicsFactory, {
    ProcessDataEpicsFactoryProps,
    ProcessesInfo,
} from './getProcessDataEpicsFactory';
import { mapStateSlice } from './rxjsCustomFilters';

const processParametersObservable: ProcessDataEpicsFactoryProps<
    FindSimilarGenesData
>['processParametersObservable'] = (action$, state$) => {
    return combineLatest([
        action$.pipe(ofType(fetchGenesSimilarities)),
        state$.pipe(
            mapStateSlice((state) => {
                return getBasketExpressionsIds(state.timeSeries);
            }),
        ),
        state$.pipe(
            mapStateSlice((state) => {
                return getGenesSimilaritiesQueryGeneId(state.genesSimilarities) ?? '';
            }),
        ),
        state$.pipe(
            mapStateSlice((state) => {
                return getGenesSimilaritiesDistanceMeasure(state.genesSimilarities);
            }),
        ),
    ]).pipe(
        filter(() => getGenesSimilarities(state$.value.genesSimilarities).length === 0),
        switchMap(
            // Unused _fetchGenesSimilarities var is necessary to keep rxjs from piping before
            // fetchGenesSimilarities action is emitted (after find similar genes modal is opened).
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ([_fetchGenesSimilarities, expressionsIds, queryGeneId, distanceMeasure]) => {
                // The {Pearson/Spearman} correlation between genes must be computed on at least
                // two genes.
                if (queryGeneId === '') {
                    return of({});
                }

                // If basket expressions aren't in store yet, hierarchical clustering can't be
                // computed.
                if (expressionsIds.length === 0) {
                    return of({});
                }

                return of({
                    expressions: _.sortBy(expressionsIds),
                    gene: queryGeneId,
                    distance: distanceMeasure,
                });
            },
        ),
    );
};

const getFindSimilarGenesProcessDataEpics = getProcessDataEpicsFactory<FindSimilarGenesData>({
    processInfo: ProcessesInfo.FindSimilarGenes,
    processParametersObservable,
    fetchDataActionCreator: fetchGenesSimilaritiesData,
    processStartedActionCreator: genesSimilaritiesFetchStarted,
    processEndedActionCreator: genesSimilaritiesFetchEnded,
    fetchDataSucceededActionCreator: fetchGenesSimilaritiesDataSucceeded,
    getStorageIdFromData: (data) => {
        return data.output.similar_genes;
    },
    actionFromStorageResponse: (storage: Storage) =>
        genesSimilaritiesFetchSucceeded(storage.json['similar genes']),
});

const handleSelectedGenesChangedEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return state$.pipe(
        mapStateSlice(
            (state) => getSelectedGenesIds(state.genes),
            (selectedGenesIds) => selectedGenesIds.length > 0,
        ),
        filter((selectedGenesIds) => {
            const queryGeneId = getGenesSimilaritiesQueryGeneId(state$.value.genesSimilarities);
            return queryGeneId == null || !selectedGenesIds.includes(queryGeneId);
        }),
        map((selectedGenesIds) => genesSimilaritiesQueryGeneSet(selectedGenesIds[0] ?? null)),
    );
};

export default combineEpics(getFindSimilarGenesProcessDataEpics, handleSelectedGenesChangedEpic);
