import timeSeries, {
    getSelectedTimeSeries,
    getSelectedTimeSeriesLabels,
} from 'redux/stores/timeSeries';
import genes, { getSelectedGenes } from 'redux/stores/genes';
import samplesExpressions, { getSamplesExpressionsById } from 'redux/stores/samplesExpressions';
import notifications from 'redux/stores/notifications';
import authentication from 'redux/stores/authentication';
import differentialExpressions from 'redux/stores/differentialExpressions';
import layouts from 'redux/stores/layouts';
import gOEnrichment from 'redux/stores/gOEnrichment';
import { combineReducers, createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';
import { GeneExpression } from './models/internal';

const rootReducer = combineReducers({
    layouts,
    authentication,
    timeSeries,
    genes,
    samplesExpressions,
    differentialExpressions,
    gOEnrichment,
    notifications,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;

// RootState selectors (expose root state to containers).
export const getSelectedGenesExpressions = createSelector(
    (state: RootState) => getSelectedTimeSeries(state.timeSeries),
    (state: RootState) => getSelectedTimeSeriesLabels(state.timeSeries),
    (state: RootState) => getSelectedGenes(state.genes),
    (state: RootState) => getSamplesExpressionsById(state.samplesExpressions),
    (selectedTimeSeries, timeSeriesLabels, selectedGenes, samplesExpressionsById) => {
        if (_.isEmpty(samplesExpressionsById) || _.isEmpty(selectedGenes)) {
            return [];
        }

        const newGenesExpressionsData = [] as GeneExpression[];

        timeSeriesLabels.forEach((label) => {
            const timePointPartitions = selectedTimeSeries?.partitions?.filter(
                (partition) => partition.label === label,
            );

            selectedGenes.forEach((gene) => {
                const values: number[] = [];
                // Gene expressions in different samples must be averaged out (mean).
                timePointPartitions.forEach((partition) => {
                    values.push(samplesExpressionsById[partition.entity][gene.feature_id]);
                });

                newGenesExpressionsData.push({
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
