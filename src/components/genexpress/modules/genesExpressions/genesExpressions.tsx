import React, { ReactElement, useRef } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { getSelectedGenesExpressions, RootState } from 'redux/rootReducer';
import { getSelectedGenes, getHighlightedGenesIds, genesHighlighted } from 'redux/stores/genes';
import { Relation } from '@genialis/resolwe/dist/api/types/rest';
import { Gene, GeneExpression } from 'redux/models/internal';
import { getSelectedTimeSeries, getSelectedTimeSeriesLabels } from 'redux/stores/timeSeries';
import { ChartHandle } from 'components/genexpress/common/chart/chart';
import useReport from 'components/genexpress/common/reportBuilder/useReport';
import GenesExpressionsLineChart from './genesExpressionsLineChart';

const mapStateToProps = (
    state: RootState,
): {
    timeSeries: Relation;
    timeSeriesLabels: string[];
    genes: Gene[];
    genesExpressions: GeneExpression[];
    highlightedGenesIds: string[];
} => {
    return {
        timeSeries: getSelectedTimeSeries(state.timeSeries),
        timeSeriesLabels: getSelectedTimeSeriesLabels(state.timeSeries),
        genes: getSelectedGenes(state.genes),
        genesExpressions: getSelectedGenesExpressions(state),
        highlightedGenesIds: getHighlightedGenesIds(state.genes),
    };
};

const connector = connect(mapStateToProps, {
    connectedGenesHighlighted: genesHighlighted,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

const GenesExpressionsWidget = ({
    genesExpressions,
    connectedGenesHighlighted,
    highlightedGenesIds,
}: PropsFromRedux): ReactElement => {
    const chartRef = useRef<ChartHandle>();

    const handleOnHighlight = (genesNames: string[]): void => {
        connectedGenesHighlighted(genesNames);
    };

    useReport(async (processFile) => {
        if (chartRef.current != null) {
            processFile(
                'Expression Time Courses/expression_time_courses.png',
                await chartRef.current.getPngImage(),
                true,
            );
            processFile(
                'Expression Time Courses/expression_time_courses.svg',
                await chartRef.current.getSvgImage(),
                true,
            );
        }
    }, []);

    return (
        <>
            {genesExpressions.length > 0 && (
                <GenesExpressionsLineChart
                    genesExpressions={genesExpressions}
                    highlightedGenesIds={highlightedGenesIds}
                    onHighlight={handleOnHighlight}
                    ref={chartRef}
                />
            )}
        </>
    );
};

export default connector(GenesExpressionsWidget);
