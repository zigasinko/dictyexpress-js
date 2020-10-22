import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import _ from 'lodash';
import { RootState } from 'redux/rootReducer';
import { getSelectedGenes, getHighlightedGenesIds, genesHighlighted } from 'redux/stores/genes';
import { Relation, RelationPartition } from '@genialis/resolwe/dist/api/types/rest';
import { SamplesExpressionsById, Gene } from 'redux/models/internal';
import { getSelectedTimeSeries, getSelectedTimeSeriesLabels } from 'redux/stores/timeSeries';
import { getSamplesExpressionsById } from 'redux/stores/samplesExpressions';
import GeneExpressionsLineChart, { GeneVisualizationData } from './geneExpressionsLineChart';

const mapStateToProps = (
    state: RootState,
): {
    timeSeries: Relation;
    timeSeriesLabels: string[];
    genes: Gene[];
    samplesExpressionsById: SamplesExpressionsById;
    highlightedGenesIds: string[];
} => {
    return {
        // Time series to be visualized.
        timeSeries: getSelectedTimeSeries(state.timeSeries),
        // Time series labels (time points).
        timeSeriesLabels: getSelectedTimeSeriesLabels(state.timeSeries),
        // Genes to be visualized.
        genes: getSelectedGenes(state.genes),
        // Samples gene expressions data.
        samplesExpressionsById: getSamplesExpressionsById(state.samplesExpressions),
        // Highlighted genes IDs.
        highlightedGenesIds: getHighlightedGenesIds(state.genes),
    };
};

const connector = connect(mapStateToProps, {
    connectedGenesHighlighted: genesHighlighted,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

const GeneExpressions = ({
    timeSeries,
    timeSeriesLabels,
    genes,
    samplesExpressionsById,
    connectedGenesHighlighted,
    highlightedGenesIds,
}: PropsFromRedux): ReactElement => {
    const [genesExpressionsData, setGenesExpressionsData] = useState<GeneVisualizationData[]>([]);

    const findLabelPartitions = useCallback(
        (label: string): RelationPartition[] => {
            return timeSeries?.partitions?.filter((partition) => partition.label === label);
        },
        [timeSeries],
    );

    const handleOnHighlight = (genesNames: string[]): void => {
        connectedGenesHighlighted(genesNames);
    };

    // Each time timeSeries or genes changes, visualization data must be refreshed.
    useEffect(() => {
        if (
            timeSeries == null ||
            Object.keys(samplesExpressionsById).length === 0 ||
            genes.length === 0
        ) {
            return;
        }

        const newGenesExpressionsData = [] as GeneVisualizationData[];

        timeSeriesLabels.forEach((label) => {
            const timePointPartitions = findLabelPartitions(label);
            genes.forEach((gene) => {
                const values: number[] = [];
                timePointPartitions.forEach((partition) => {
                    values.push(samplesExpressionsById[partition.entity][gene.feature_id]);
                });

                newGenesExpressionsData.push({
                    x: label,
                    y: _.mean(values),
                    geneId: gene.feature_id,
                });
            });
        });

        setGenesExpressionsData(newGenesExpressionsData);
    }, [timeSeries, genes, timeSeriesLabels, findLabelPartitions, samplesExpressionsById]);

    return (
        <>
            {genesExpressionsData.length > 0 && (
                <GeneExpressionsLineChart
                    data={genesExpressionsData}
                    highlightedGenesIds={highlightedGenesIds}
                    onHighlight={handleOnHighlight}
                />
            )}
        </>
    );
};

export default connector(GeneExpressions);
