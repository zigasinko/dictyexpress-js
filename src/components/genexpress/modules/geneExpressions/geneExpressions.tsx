import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import _ from 'lodash';
import { Relation, RelationPartition } from '@genialis/resolwe/dist/api/types/rest';
import { RootState } from '../../../../redux/rootReducer';
import { getSelectedGenes, getHighlightedGenesNames } from '../../../../redux/stores/genes';
import { Gene, SamplesExpressionsById } from '../../../../redux/models/internal';
import {
    getSelectedTimeSeries,
    getSelectedTimeSeriesLabels,
} from '../../../../redux/stores/timeSeries';
import { getSamplesExpressionsById } from '../../../../redux/stores/samplesExpressions';

const mapStateToProps = (
    state: RootState,
): {
    timeSeries: Relation;
    timeSeriesLabels: string[];
    genes: Gene[];
    samplesExpressionsById: SamplesExpressionsById;
    highlightedGenesNames: string[];
} => {
    return {
        // Time series to be visualized.
        timeSeries: getSelectedTimeSeries(state.timeSeries),
        // Time series labels (time points).
        timeSeriesLabels: getSelectedTimeSeriesLabels(state.timeSeries),
        // Genes to be visualized.
        genes: getSelectedGenes(state.selectedGenes),
        // Samples gene expressions data.
        samplesExpressionsById: getSamplesExpressionsById(state.samplesExpressions),
        // Genes names that are highlighted.
        highlightedGenesNames: getHighlightedGenesNames(state.selectedGenes),
    };
};

const connector = connect(mapStateToProps, {});

type PropsFromRedux = ConnectedProps<typeof connector>;

type GeneVisualizationData = {
    geneName: string;
    label: string;
    color?: string;
    data: unknown[][];
};

const GeneExpressions = ({
    timeSeries,
    timeSeriesLabels,
    genes,
    samplesExpressionsById,
}: PropsFromRedux): ReactElement => {
    const [genesExpressionsData, setGenesExpressionsData] = useState<GeneVisualizationData[]>([]);

    const findLabelPartitions = useCallback(
        (label: string): RelationPartition[] => {
            return timeSeries?.partitions?.filter((partition) => partition.label === label);
        },
        [timeSeries],
    );

    // Each time timeSeries or genes changes, visualization data must be refreshed.
    useEffect(() => {
        if (timeSeries == null || Object.keys(samplesExpressionsById).length === 0) {
            return;
        }

        const newGenesExpressionsData = [] as GeneVisualizationData[];

        // Get data for each gene (average values from all partitions - time points).
        genes.forEach((gene) => {
            const geneVisualizationData = {
                geneName: gene.name,
                label: gene.name,
                data: [],
            } as GeneVisualizationData;
            // Retrieve partitions samples for the gene and average samples expressions values.
            const values: number[] = [];
            timeSeriesLabels.forEach((label) => {
                const timePointPartitions = findLabelPartitions(label);
                timePointPartitions.forEach((partition) => {
                    values.push(samplesExpressionsById[partition.entity][gene.feature_id]);
                });

                geneVisualizationData.data.push([label, _.mean(values)]);
            });

            newGenesExpressionsData.push(geneVisualizationData);
        });

        setGenesExpressionsData(newGenesExpressionsData);
    }, [timeSeries, genes, timeSeriesLabels, findLabelPartitions, samplesExpressionsById]);

    return (
        <>
            <span>This should be a geneExpressions visualization!</span>
            <div>{JSON.stringify(genesExpressionsData)}</div>
        </>
    );
};

export default connector(GeneExpressions);
