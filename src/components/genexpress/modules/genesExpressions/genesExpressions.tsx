import React, { ChangeEvent, ReactElement, useRef, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { getSelectedGenesExpressions, RootState } from 'redux/rootReducer';
import { getHighlightedGenesIds, genesHighlighted, getSelectedGenesIds } from 'redux/stores/genes';
import { GeneExpression } from 'redux/models/internal';
import { ChartHandle } from 'components/genexpress/common/chart/chart';
import useReport from 'components/genexpress/common/reportBuilder/useReport';
import { Button, FormControlLabel, Switch } from '@material-ui/core';
import GenesExpressionsLineChart from './genesExpressionsLineChart';
import {
    GenesExpressionsContainer,
    GenesExpressionsControls,
    GenesExpressionsLineChartContainer,
} from './genesExpressions.style';
import FindSimilarGenesModal from './findSimilarGenesModal/findSimilarGenesModal';

const mapStateToProps = (
    state: RootState,
): {
    selectedGenesIds: string[];
    genesExpressions: GeneExpression[];
    highlightedGenesIds: string[];
} => {
    return {
        selectedGenesIds: getSelectedGenesIds(state.genes),
        genesExpressions: getSelectedGenesExpressions(state),
        highlightedGenesIds: getHighlightedGenesIds(state.genes),
    };
};

const connector = connect(mapStateToProps, {
    connectedGenesHighlighted: genesHighlighted,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

const GenesExpressionsWidget = ({
    selectedGenesIds,
    genesExpressions,
    connectedGenesHighlighted,
    highlightedGenesIds,
}: PropsFromRedux): ReactElement => {
    const [findSimilarGenesModalOpened, setManageModalOpened] = useState(false);
    const [showLegend, setShowLegend] = useState(false);
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

    const handleDisplayLegendOnChange = (event: ChangeEvent<HTMLInputElement>): void => {
        setShowLegend(event.target.checked);
    };

    return (
        <>
            <GenesExpressionsContainer>
                <GenesExpressionsControls>
                    <Button
                        type="button"
                        onClick={handleFindSimilarOnClick}
                        disabled={selectedGenesIds.length === 0}
                    >
                        Find similar genes
                    </Button>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={showLegend}
                                onChange={handleDisplayLegendOnChange}
                                size="small"
                            />
                        }
                        label="Legend"
                        labelPlacement="top"
                    />
                </GenesExpressionsControls>
                {genesExpressions.length > 0 && (
                    <GenesExpressionsLineChartContainer>
                        <GenesExpressionsLineChart
                            genesExpressions={genesExpressions}
                            selectedGenesIds={selectedGenesIds}
                            highlightedGenesIds={highlightedGenesIds}
                            onHighlight={handleOnHighlight}
                            ref={chartRef}
                            showLegend={showLegend}
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
