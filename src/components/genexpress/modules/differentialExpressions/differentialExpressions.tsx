import React, { ReactElement, useEffect, useState, ChangeEvent, useRef, useCallback } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import _ from 'lodash';
import { RootState } from 'redux/rootReducer';
import { getGenesById, getHighlightedGenesIds, getSelectedGenesIds } from 'redux/stores/genes';
import { DifferentialExpression, Thresholds, VolcanoPoint } from 'redux/models/internal';
import { getMinMax, logOfBase } from 'utils/math';
import {
    differentialExpressionSelected,
    getDifferentialExpressions,
    getSelectedDifferentialExpression,
} from 'redux/stores/differentialExpressions';
import {
    FormControlLabel,
    MenuItem,
    SelectChangeEvent,
    Switch,
    TextField,
    Tooltip,
} from '@mui/material';
import { SwapHoriz } from '@mui/icons-material';
import { withSize, SizeMeProps } from 'react-sizeme';
import { getSelectedTimeSeries } from 'redux/stores/timeSeries';
import DictySelect from 'components/genexpress/common/dictySelect/dictySelect';
import { objectsArrayToTsv } from 'utils/reportUtils';
import useReport from 'components/genexpress/common/reportBuilder/useReport';
import useStateWithEffect from 'components/genexpress/common/useStateWithEffect';
import DifferentialExpressionsVolcanoPlot from './differentialExpressionsVolcanoPlot';
import { ChartHandle } from '../../common/chart/chart';
import {
    DifferentialExpressionsContainer,
    DifferentialExpressionsControls,
    DifferentialExpressionsSelectWrapper,
    ThresholdFormControl,
    ThresholdFormControlsContainer,
    VolcanoPlotContainer,
} from './differentialExpressions.styles';
import VolcanoPointSelectionModal from './volcanoPointsSelectionModal/volcanoPointsSelectionModal';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mapStateToProps = (state: RootState) => {
    return {
        selectedTimeSeries: getSelectedTimeSeries(state.timeSeries),
        differentialExpressions: getDifferentialExpressions(state.differentialExpressions),
        selectedDifferentialExpression: getSelectedDifferentialExpression(
            state.differentialExpressions,
        ),
        highlightedGenesIds: getHighlightedGenesIds(state.genes),
        selectedGenesIds: getSelectedGenesIds(state.genes),
        genesById: getGenesById(state.genes),
    };
};

const connector = connect(mapStateToProps, {
    connectedDifferentialExpressionSelected: differentialExpressionSelected,
});

type PropsFromRedux = ConnectedProps<typeof connector>;
type DifferentialExpressionsProps = PropsFromRedux & SizeMeProps;

const logFcOutliersLimit = 7;
const ROUND_PRECISION = 2;
const P_VALUE_FRACTION_DIGITS = 5;

const DifferentialExpressions = ({
    selectedTimeSeries,
    selectedDifferentialExpression,
    differentialExpressions,
    highlightedGenesIds,
    selectedGenesIds,
    size: { width },
    genesById,
    connectedDifferentialExpressionSelected,
}: DifferentialExpressionsProps): ReactElement => {
    const differentialExpressionsSelectElement = useRef<HTMLDivElement>(null);
    const [volcanoPointSelectionModalOpened, setVolcanoPointSelectionModalOpened] = useState(false);

    const chartRef = useRef<ChartHandle>();

    const [volcanoPoints, setVolcanoPoints] = useState<VolcanoPoint[]>([]);
    const [selectedVolcanoPoints, setSelectedVolcanoPoints] = useState<VolcanoPoint[]>([]);
    const [hasOutliers, setHasOutliers] = useState(true);
    const [displayOutliers, setDisplayOutliers] = useState(false);
    const [displayThresholdControls, setDisplayThresholdControls] = useState({
        firstLevel: false,
        secondLevel: false,
    });

    const probField =
        selectedDifferentialExpression != null
            ? selectedDifferentialExpression.prob_field
            : 'p value';
    const probFieldLabel = probField.toUpperCase();

    const defaultThresholds: Thresholds = useStateWithEffect(() => {
        if (selectedDifferentialExpression == null) {
            return { pValue: 0.01, pValueLog: 2, fc: 2, fcLog: 1 };
        }
        return {
            pValue: selectedDifferentialExpression.prob_threshold,
            pValueLog: _.round(
                -logOfBase(selectedDifferentialExpression.prob_threshold, 10),
                ROUND_PRECISION,
            ),
            fc: _.round(2 ** selectedDifferentialExpression.logfc_threshold, ROUND_PRECISION),
            fcLog: selectedDifferentialExpression.logfc_threshold,
        };
    }, [selectedDifferentialExpression]);

    const [thresholds, setThresholds] = useState<Thresholds>(defaultThresholds);

    const getLogProbLimit = (data: { logProbValue: number }[]): number => {
        const HIGHEST_CALCULABLE_LOG_PROB = -logOfBase(Number.MIN_VALUE, 10);
        if (_.isEmpty(data)) return HIGHEST_CALCULABLE_LOG_PROB;

        const highestValueInData = _.max(
            _.map(data, ({ logProbValue }) => Number.isFinite(logProbValue) && logProbValue),
        );
        if (highestValueInData) {
            return Math.min(HIGHEST_CALCULABLE_LOG_PROB, highestValueInData * 1.1);
        }

        return HIGHEST_CALCULABLE_LOG_PROB;
    };

    // Each time selected differential expression or genes changes, visualization data must be refreshed.
    useEffect(() => {
        if (selectedDifferentialExpression == null || selectedDifferentialExpression.json == null) {
            setVolcanoPoints([]);
            return;
        }

        const tempVolcanoData: Omit<VolcanoPoint, 'logProbFiniteValue'>[] =
            selectedDifferentialExpression.json.gene_id.map((geneId: string, index: number) => {
                const probValue =
                    selectedDifferentialExpression.json[selectedDifferentialExpression.prob_field][
                        index
                    ];

                return {
                    geneId,
                    logFcValue: selectedDifferentialExpression.json.logfc[index],
                    logProbValue: -logOfBase(probValue, 10),
                    probValue,
                };
            });

        const logProbLimit = getLogProbLimit(tempVolcanoData);
        const volcanoData = _.map(tempVolcanoData, (datum) => {
            return {
                ...datum,
                logProbFiniteValue: Math.min(datum.logProbValue, logProbLimit),
            };
        });

        setVolcanoPoints(volcanoData);
    }, [selectedDifferentialExpression]);

    /**
     * Check for outliers (if any points fall outside of logFcOutliersLimit) each time the data changes.
     */
    useEffect(() => {
        const [minX, maxX] = getMinMax(volcanoPoints.map((datum) => datum.logFcValue));

        const outliersOnLeft = minX < -logFcOutliersLimit;
        const outliersOnRight = maxX > logFcOutliersLimit;
        setHasOutliers(outliersOnLeft || outliersOnRight);
    }, [volcanoPoints]);

    /**
     * Check if threshold controls can be displayed or not (is there space).
     */
    useEffect(() => {
        if (differentialExpressionsSelectElement.current == null || width == null) {
            return;
        }
        const availableWidth = width - differentialExpressionsSelectElement.current.clientWidth;
        setDisplayThresholdControls({
            firstLevel: availableWidth > 348, // 2 * FormControl.offsetWidth(135) + FormControlLabel.offsetWidth(78)
            secondLevel: availableWidth > 666, // 4 * FormControl.offsetWidth(135) + FormControlLabel.offsetWidth(78) + 2 * swap icon width(24)
        });
    }, [width]);

    const getCaption = useCallback((): string => {
        return `
Differential expression: The x-axis indicates the log2 value of fold-change in
differential expression ${selectedDifferentialExpression?.name ?? ''}. The ${probFieldLabel} on the
y-axis is the probability that the gene is differentially expressed. Higher
-log10(${probFieldLabel}) indicates higher probability that the gene is
differentially expressed and not a false positive, while the value of 3
corresponds to 99.999% chance that the gene is differentially expressed. Genes
which are significantly up-regulated are located in the upper right square of
each graph (these have a positive log fold value), while down-regulated genes
are located in the upper left square (these have a negative log fold value).
Genes in the lower left and right squares of the graph are probably false
positives.
        `.trim();
    }, [probFieldLabel, selectedDifferentialExpression]);

    useReport(
        async (processFile) => {
            processFile(
                'Differential Expressions/selected_differential_expression.tsv',
                objectsArrayToTsv([
                    _.pick(selectedDifferentialExpression, [
                        'name',
                        'slug',
                        'created',
                        'logfc_threshold',
                        'prob_field',
                        'prob_threshold',
                        'up_regulated',
                        'down_regulated',
                    ]),
                ]),
                false,
            );

            if (volcanoPoints.length === 0) {
                return;
            }
            const dataTable = volcanoPoints.map((volcanoPoint) => ({
                ...volcanoPoint,
                gene_symbol: genesById[volcanoPoint.geneId] && genesById[volcanoPoint.geneId].name,
            }));
            processFile('Differential Expressions/table.tsv', objectsArrayToTsv(dataTable), false);
            if (chartRef.current != null) {
                processFile(
                    'Differential Expressions/volcano_image.png',
                    await chartRef.current.getPngImage(),
                    true,
                );
                processFile(
                    'Differential Expressions/volcano_image.svg',
                    await chartRef.current.getSvgImage(),
                    true,
                );
                processFile('Differential Expressions/caption.txt', getCaption(), false);
            }
        },
        [genesById, getCaption, selectedDifferentialExpression, volcanoPoints],
    );

    const handleDifferentialExpressionsOnChange = (event: SelectChangeEvent<unknown>): void => {
        connectedDifferentialExpressionSelected(event.target.value as number);
        // Unfocus select element.
        document.body.focus();
    };

    /**
     * Handles user points selection on volcano plot.
     *  -> Opens a dialog with selected genes.
     * @param genesIds - IDs of genes that were selected on differential expressions volcano plot.
     */
    const handlePlotOnSelect = (genesIds: string[]): void => {
        setSelectedVolcanoPoints(
            volcanoPoints.filter((volcanoPoint) => genesIds.includes(volcanoPoint.geneId)),
        );
        setVolcanoPointSelectionModalOpened(true);
    };

    const roundPValue = (pValue: number): number => {
        return parseFloat(pValue.toExponential(P_VALUE_FRACTION_DIGITS));
    };

    const handleOutliersOnChange = (event: ChangeEvent<HTMLInputElement>): void => {
        setDisplayOutliers(event.target.checked);
    };

    const handleThresholdChange = (
        thresholdField: 'pValue' | 'pValueLog' | 'fc' | 'fcLog',
        value: number,
    ): void => {
        const newThresholds = { ...thresholds };
        newThresholds[thresholdField] = value;
        switch (thresholdField) {
            // Update fcLog.
            case 'fc': {
                newThresholds.fcLog = _.round(logOfBase(newThresholds.fc, 2), ROUND_PRECISION);
                break;
            }
            // Update fc.
            case 'fcLog': {
                newThresholds.fc = _.round(2 ** newThresholds.fcLog, ROUND_PRECISION);
                break;
            }
            // Update pValueLog.
            case 'pValue': {
                newThresholds.pValueLog = _.round(
                    -logOfBase(newThresholds.pValue, 10),
                    ROUND_PRECISION,
                );
                break;
            }
            // Update pValue.
            case 'pValueLog': {
                newThresholds.pValue = roundPValue(10 ** -newThresholds.pValueLog);
                break;
            }
            default:
        }

        setThresholds(newThresholds);
    };

    const getThresholdFormControl = (
        thresholdField: 'pValue' | 'pValueLog' | 'fc' | 'fcLog',
        label: string,
    ): ReactElement => (
        <ThresholdFormControl>
            <TextField
                id={`${thresholdField}fc_threshold`}
                color="secondary"
                size="small"
                label={label}
                type="number"
                onChange={(event: ChangeEvent<{ value: unknown }>): void =>
                    handleThresholdChange(thresholdField, event.target.value as number)
                }
                value={thresholds[thresholdField]}
            />
        </ThresholdFormControl>
    );

    return (
        <>
            <DifferentialExpressionsContainer>
                <DifferentialExpressionsControls>
                    <Tooltip
                        title={
                            // eslint-disable-next-line no-nested-ternary
                            selectedTimeSeries == null
                                ? 'No time series selected'
                                : differentialExpressions.length === 0
                                ? "Selected time series doesn't have any differential expressions."
                                : ''
                        }
                    >
                        <DifferentialExpressionsSelectWrapper
                            ref={differentialExpressionsSelectElement}
                        >
                            <DictySelect
                                label="Differential expression"
                                value={
                                    selectedDifferentialExpression != null
                                        ? selectedDifferentialExpression.id
                                        : ''
                                }
                                handleOnChange={handleDifferentialExpressionsOnChange}
                                disabled={differentialExpressions.length === 0}
                            >
                                {differentialExpressions.map((differentialExpression) => (
                                    <MenuItem
                                        value={differentialExpression.id}
                                        key={differentialExpression.id}
                                    >
                                        {differentialExpression.name}
                                    </MenuItem>
                                ))}
                            </DictySelect>
                        </DifferentialExpressionsSelectWrapper>
                    </Tooltip>
                    {volcanoPoints.length > 0 && (
                        <ThresholdFormControlsContainer>
                            {displayThresholdControls.firstLevel &&
                                getThresholdFormControl('fc', 'Fold Change')}

                            {displayThresholdControls.secondLevel && (
                                <>
                                    <SwapHoriz />
                                    {getThresholdFormControl('fcLog', 'log2(Fold Change)')}
                                </>
                            )}
                            {displayThresholdControls.firstLevel &&
                                getThresholdFormControl('pValue', probFieldLabel)}

                            {displayThresholdControls.secondLevel && (
                                <>
                                    <SwapHoriz />
                                    {getThresholdFormControl(
                                        'pValueLog',
                                        `-log10(${probFieldLabel})`,
                                    )}
                                </>
                            )}
                            {hasOutliers && displayThresholdControls.firstLevel && (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={displayOutliers}
                                            onChange={handleOutliersOnChange}
                                        />
                                    }
                                    label="Outliers"
                                    labelPlacement="top"
                                />
                            )}
                        </ThresholdFormControlsContainer>
                    )}
                </DifferentialExpressionsControls>
                {volcanoPoints.length > 0 && (
                    <VolcanoPlotContainer>
                        <DifferentialExpressionsVolcanoPlot
                            probField={probField}
                            data={volcanoPoints}
                            thresholds={thresholds}
                            highlightedGenesIds={highlightedGenesIds}
                            selectedGenesIds={selectedGenesIds}
                            logFcOutliersLimit={logFcOutliersLimit}
                            displayOutliers={displayOutliers}
                            onSelect={handlePlotOnSelect}
                            ref={chartRef}
                        />
                    </VolcanoPlotContainer>
                )}
            </DifferentialExpressionsContainer>
            {volcanoPointSelectionModalOpened && (
                <VolcanoPointSelectionModal
                    differentialExpressionName={
                        (selectedDifferentialExpression as DifferentialExpression).name
                    }
                    probFieldLabel={probFieldLabel}
                    handleOnClose={(): void => setVolcanoPointSelectionModalOpened(false)}
                    volcanoPoints={selectedVolcanoPoints}
                />
            )}
        </>
    );
};

export default withSize({
    monitorHeight: true,
    monitorWidth: true,
    refreshRate: 100,
    refreshMode: 'debounce',
})(connector(DifferentialExpressions));
