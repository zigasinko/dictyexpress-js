import React, { ReactElement, useRef, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { getSelectedGenesExpressions, RootState } from 'redux/rootReducer';
import { getSelectedGenes, getHighlightedGenesIds, genesHighlighted } from 'redux/stores/genes';
import { Gene, GeneExpression } from 'redux/models/internal';
import { ChartHandle } from 'components/genexpress/common/chart/chart';
import useReport from 'components/genexpress/common/reportBuilder/useReport';
import { Button } from '@material-ui/core';
import GenesExpressionsLineChart from './genesExpressionsLineChart';
import {
    GenesExpressionsContainer,
    GenesExpressionsLineChartContainer,
} from './genesExpressions.style';
import FindSimilarGenesModal from './findSimilarGenesModal/findSimilarGenesModal';

const mapStateToProps = (
    state: RootState,
): {
    selectedGenes: Gene[];
    genesExpressions: GeneExpression[];
    highlightedGenesIds: string[];
} => {
    return {
        selectedGenes: getSelectedGenes(state.genes),
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
    selectedGenes,
    connectedGenesHighlighted,
    highlightedGenesIds,
}: PropsFromRedux): ReactElement => {
    const [findSimilarGenesModalOpened, setManageModalOpened] = useState(false);
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

    const handleFindSimilarOnClick = (): void => {
        setManageModalOpened(true);
    };

    return (
        <>
            <GenesExpressionsContainer>
                <div>
                    <Button
                        type="button"
                        onClick={handleFindSimilarOnClick}
                        disabled={selectedGenes.length === 0}
                    >
                        Find similar genes
                    </Button>
                </div>
                {genesExpressions.length > 0 && (
                    <GenesExpressionsLineChartContainer>
                        <GenesExpressionsLineChart
                            genesExpressions={genesExpressions}
                            highlightedGenesIds={highlightedGenesIds}
                            onHighlight={handleOnHighlight}
                            ref={chartRef}
                        />
                    </GenesExpressionsLineChartContainer>
                )}
            </GenesExpressionsContainer>
            {findSimilarGenesModalOpened && (
                <FindSimilarGenesModal handleOnClose={(): void => setManageModalOpened(false)} />
            )}
        </>
    );
};

export default connector(GenesExpressionsWidget);
