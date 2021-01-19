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
    genesSimilaritiesDistanceMeasureChanged,
    genesSimilaritiesFetchEnded,
    genesSimilaritiesFetchStarted,
    genesSimilaritiesQueryGeneSelected,
    genesSimilaritiesFetchSucceeded,
    genesSimilaritiesQueryGeneSet,
} from 'redux/stores/genesSimilarities';
import { combineEpics, Epic, ofType } from 'redux-observable';
import { mergeMap, withLatestFrom } from 'rxjs/operators';
import { EMPTY, of } from 'rxjs';
import { Action } from '@reduxjs/toolkit';
import {
    fetchGenesSimilarities,
    fetchGenesSimilaritiesData,
    fetchGenesSimilaritiesDataSucceeded,
    selectedGenesChanged,
} from './epicsActions';
import getOrCreateProcessDataEpics, { ProcessesInfo } from './getProcessDataEpicsFactory';

const getGOEnrichmentProcessDataEpics = getOrCreateProcessDataEpics<FindSimilarGenesData>({
    processInfo: ProcessesInfo.FindSimilarGenes,
    inputActions: [
        fetchGenesSimilarities.toString(),
        genesSimilaritiesQueryGeneSelected.toString(),
        genesSimilaritiesDistanceMeasureChanged.toString(),
    ],
    getGetOrCreateInput: (state: RootState) => {
        if (getGenesSimilarities(state.genesSimilarities).length > 0) {
            return {};
        }

        const expressionsIds = getBasketExpressionsIds(state.timeSeries);
        const queryGeneId = getGenesSimilaritiesQueryGeneId(state.genesSimilarities);
        const distanceMeasure = getGenesSimilaritiesDistanceMeasure(state.genesSimilarities);

        if (queryGeneId == null) {
            return {};
        }

        return {
            expressions: _.sortBy(expressionsIds),
            gene: queryGeneId,
            distance: distanceMeasure,
        };
    },
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
    return action$.pipe(
        ofType(selectedGenesChanged),
        withLatestFrom(state$),
        mergeMap(([, state]) => {
            const selectedGenesIds = getSelectedGenesIds(state.genes);
            const queryGeneId = getGenesSimilaritiesQueryGeneId(state.genesSimilarities);

            if (queryGeneId == null || !selectedGenesIds.includes(queryGeneId)) {
                return of(genesSimilaritiesQueryGeneSet(selectedGenesIds[0] ?? null));
            }

            return EMPTY;
        }),
    );
};

export default combineEpics(getGOEnrichmentProcessDataEpics, handleSelectedGenesChangedEpic);
