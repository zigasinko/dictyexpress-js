import React, { ReactElement, useRef, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Button, FormControlLabel, Switch } from '@mui/material';
import GenesExpressionsLineChart from './genesExpressionsLineChart';
import {
    GenesExpressionsContainer,
    GenesExpressionsControls,
    GenesExpressionsLineChartContainer,
} from './genesExpressions.style';
import FindSimilarGenesModal from './findSimilarGenesModal/findSimilarGenesModal';
import SelectComparisonTimeSeriesModal from './selectComparisonTimeSeriesModal/selectComparisonTimeSeriesModal';
import {
    getSelectedGenesComparisonExpressions,
    getSelectedGenesExpressions,
    RootState,
} from 'redux/rootReducer';
import { getHighlightedGenesIds, genesHighlighted, getSelectedGenesIds } from 'redux/stores/genes';
import { getBasketExpressionsIds, getComparisonTimeSeries } from 'redux/stores/timeSeries';
import { ChartHandle } from 'components/genexpress/common/chart/chart';
import useReport from 'components/genexpress/common/reportBuilder/useReport';
import { GeneExpression } from 'redux/models/internal';
import useStateWithEffect from 'components/genexpress/common/useStateWithEffect';
import useBookmarkableState from 'components/genexpress/common/useBookmarkableState';
import { BookmarkStatePath } from 'components/genexpress/common/constants';

const mapStateToProps = (state: RootState) => {
    return {
        genesExpressions: getSelectedGenesExpressions(state),
        basketExpressionsIds: getBasketExpressionsIds(state.timeSeries),
        comparisonGenesExpressions: getSelectedGenesComparisonExpressions(state),
        selectedGenesIds: getSelectedGenesIds(state.genes),
        highlightedGenesIds: getHighlightedGenesIds(state.genes),
        comparisonTimeSeries: getComparisonTimeSeries(state.timeSeries),
    };
};

const connector = connect(mapStateToProps, {
    connectedGenesHighlighted: genesHighlighted,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

const GenesExpressionsWidget = ({
    selectedGenesIds,
    genesExpressions,
    basketExpressionsIds,
    comparisonGenesExpressions,
    connectedGenesHighlighted,
    highlightedGenesIds,
    comparisonTimeSeries,
}: PropsFromRedux): ReactElement => {
    const [findSimilarGenesModalOpened, setFindSimilarGenesModalOpened] = useState(false);
    const [selectTimeSeriesModalOpened, setSelectTimeSeriesModalOpened] = useState(false);
    const [showLegend, setShowLegend] = useBookmarkableState(
        false,
        BookmarkStatePath.genesExpressionsShowLegend,
    );
    const [colorByTimeSeries, setColorByTimeSeries] = useBookmarkableState(
        false,
        BookmarkStatePath.genesExpressionsColorByTimeSeries,
    );
    const chartRef = useRef<ChartHandle>(null);
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

    const allGenesExpressions: GeneExpression[] = useStateWithEffect(
        () => [...genesExpressions, ...comparisonGenesExpressions],
        [comparisonGenesExpressions, genesExpressions],
    );

    const disabledControls = selectedGenesIds.length === 0;

    return (
        <>
            <GenesExpressionsContainer>
                <GenesExpressionsControls>
                    <div>
                        <Button
                            onClick={(): void => {
                                setFindSimilarGenesModalOpened(true);
                            }}
                            disabled={disabledControls || basketExpressionsIds.length === 0}
                        >
                            Find similar genes
                        </Button>
                        <Button
                            onClick={(): void => {
                                setSelectTimeSeriesModalOpened(true);
                            }}
                            disabled={disabledControls}
                        >
                            Compare to ({comparisonTimeSeries.length} experiment
                            {comparisonTimeSeries.length === 1 ? '' : 's'})
                        </Button>
                    </div>
                    <div>
                        <FormControlLabel
                            disabled={disabledControls}
                            control={
                                <Switch
                                    checked={colorByTimeSeries}
                                    onChange={(event): void => {
                                        setColorByTimeSeries(event.target.checked);
                                    }}
                                    size="small"
                                />
                            }
                            label="Color by time series"
                            labelPlacement="top"
                        />
                        <FormControlLabel
                            disabled={disabledControls}
                            control={
                                <Switch
                                    checked={showLegend}
                                    onChange={(event): void => {
                                        setShowLegend(event.target.checked);
                                    }}
                                    size="small"
                                />
                            }
                            label="Legend"
                            labelPlacement="top"
                        />
                    </div>
                </GenesExpressionsControls>
                {genesExpressions.length > 0 && (
                    <GenesExpressionsLineChartContainer data-testid="genes-expressions-line-chart">
                        <GenesExpressionsLineChart
                            genesExpressions={allGenesExpressions}
                            comparisonTimeSeries={comparisonTimeSeries}
                            selectedGenesIds={selectedGenesIds}
                            highlightedGenesIds={highlightedGenesIds}
                            onHighlight={handleOnHighlight}
                            ref={chartRef}
                            colorByTimeSeries={colorByTimeSeries}
                            showLegend={showLegend}
                        />
                    </GenesExpressionsLineChartContainer>
                )}
            </GenesExpressionsContainer>
            <FindSimilarGenesModal
                open={findSimilarGenesModalOpened}
                handleOnClose={(): void => setFindSimilarGenesModalOpened(false)}
            />
            {selectTimeSeriesModalOpened && (
                <SelectComparisonTimeSeriesModal
                    handleOnClose={(): void => setSelectTimeSeriesModalOpened(false)}
                />
            )}
        </>
    );
};

export default connector(GenesExpressionsWidget);
