import timeSeries, {
    getComparisonTimeSeries,
    getSelectedTimeSeries,
    getSelectedTimeSeriesLabels,
} from 'redux/stores/timeSeries';
import genes, { getGenesById, getSelectedGenes } from 'redux/stores/genes';
import genesSimilarities, { getGenesSimilaritiesQueryGeneId } from 'redux/stores/genesSimilarities';
import samplesExpressions, {
    getSamplesExpressionsById,
    getSamplesExpressionsSamplesIds,
} from 'redux/stores/samplesExpressions';
import notifications from 'redux/stores/notifications';
import authentication from 'redux/stores/authentication';
import differentialExpressions from 'redux/stores/differentialExpressions';
import layouts from 'redux/stores/layouts';
import gOEnrichment from 'redux/stores/gOEnrichment';
import clustering from 'redux/stores/clustering';
import { combineReducers, createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';
import { EMPTY_ARRAY } from 'components/genexpress/common/constants';
import { GeneExpression } from './models/internal';

const rootReducer = combineReducers({
    layouts,
    authentication,
    timeSeries,
    genes,
    genesSimilarities,
    samplesExpressions,
    differentialExpressions,
    gOEnrichment,
    clustering,
    notifications,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;

export const getSelectedGenesExpressions = createSelector(
    (state: RootState) => getSelectedTimeSeries(state.timeSeries),
    (state: RootState) => getSelectedTimeSeriesLabels(state.timeSeries),
    (state: RootState) => getSelectedGenes(state.genes),
    (state: RootState) => getSamplesExpressionsById(state.samplesExpressions),
    (selectedTimeSeries, timeSeriesLabels, selectedGenes, samplesExpressionsById) => {
        if (_.isEmpty(samplesExpressionsById) || _.isEmpty(selectedGenes)) {
            return EMPTY_ARRAY;
        }

        const newGenesExpressionsData = [] as GeneExpression[];

        timeSeriesLabels.forEach((label) => {
            const timePointPartitions = selectedTimeSeries.partitions.filter(
                (partition) => partition.label === label,
            );

            selectedGenes.forEach((gene) => {
                const values: number[] = [];
                // Gene expressions in different samples must be averaged out (mean).
                timePointPartitions.forEach((partition) => {
                    values.push(samplesExpressionsById[partition.entity][gene.feature_id]);
                });

                newGenesExpressionsData.push({
                    timeSeriesName: selectedTimeSeries.collection.name,
                    label,
                    value: _.mean(values),
                    geneId: gene.feature_id,
                    geneName: gene.name,
                });
            });
        });

        return newGenesExpressionsData;
    },
);

export const getSelectedGenesComparisonExpressions = createSelector(
    (state: RootState) => getComparisonTimeSeries(state.timeSeries),
    (state: RootState) => getSelectedTimeSeriesLabels(state.timeSeries),
    (state: RootState) => getSelectedGenes(state.genes),
    (state: RootState) => getSamplesExpressionsById(state.samplesExpressions),
    (state: RootState) => getSamplesExpressionsSamplesIds(state.samplesExpressions),
    (
        comparisonTimeSeries,
        timeSeriesLabels,
        selectedGenes,
        samplesExpressionsById,
        samplesExpressionsSamplesIds,
    ) => {
        if (_.isEmpty(samplesExpressionsById) || _.isEmpty(selectedGenes)) {
            return [];
        }

        const newGenesExpressionsData = [] as GeneExpression[];

        timeSeriesLabels.forEach((label) => {
            comparisonTimeSeries.forEach((singleTimeSeries) => {
                const timePointPartitions = _.flatten(
                    singleTimeSeries.partitions.filter((partition) => partition.label === label),
                );

                // If any of samplesExpressions isn't in store
                if (
                    timePointPartitions.some(
                        (partition) => !samplesExpressionsSamplesIds.includes(partition.entity),
                    )
                ) {
                    return;
                }

                selectedGenes.forEach((gene) => {
                    const values: number[] = [];
                    // Gene expressions in different samples must be averaged out (mean).
                    timePointPartitions.forEach((partition) => {
                        if (samplesExpressionsById[partition.entity][gene.feature_id] != null) {
                            values.push(samplesExpressionsById[partition.entity][gene.feature_id]);
                        }
                    });

                    if (values.length > 0) {
                        newGenesExpressionsData.push({
                            timeSeriesName: singleTimeSeries.collection.name,
                            label,
                            value: _.mean(values),
                            geneId: gene.feature_id,
                            geneName: gene.name,
                        });
                    }
                });
            });
        });

        return newGenesExpressionsData;
    },
);

export const getGenesSimilaritiesQueryGene = createSelector(
    (state: RootState) => getGenesById(state.genes),
    (state: RootState) => getGenesSimilaritiesQueryGeneId(state.genesSimilarities),
    (genesById, genesSimilaritiesQueryGeneId) => {
        if (_.isEmpty(genesById) || genesSimilaritiesQueryGeneId == null) {
            return null;
        }

        return genesById[genesSimilaritiesQueryGeneId];
    },
);
