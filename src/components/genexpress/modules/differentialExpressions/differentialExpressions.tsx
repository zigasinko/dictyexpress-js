import React, { ReactElement, useEffect, useState, ChangeEvent, useMemo, useRef } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import _ from 'lodash';
import { RootState } from 'redux/rootReducer';
import { getHighlightedGenesIds, getSelectedGenesIds } from 'redux/stores/genes';
import { DifferentialExpression, Thresholds, VolcanoPoint } from 'redux/models/internal';
import { getMinMax, logOfBase } from 'utils/math';
import {
    differentialExpressionSelected,
    getDifferentialExpressions,
    getSelectedDifferentialExpression,
} from 'redux/stores/differentialExpressions';
import {
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Tooltip,
} from '@material-ui/core';
import { SwapHoriz } from '@material-ui/icons';
import { forwardToSentry } from 'utils/errorUtils';
import { withSize, SizeMeProps } from 'react-sizeme';
import DifferentialExpressionsVolcanoPlot from './differentialExpressionsVolcanoPlot';
import {
    DifferentialExpressionsContainer,
    DifferentialExpressionsControls,
    DifferentialExpressionsFormControl,
    ThresholdFormControl,
    ThresholdFormControlsContainer,
    VolcanoPlotContainer,
} from './differentialExpressions.styles';
import VolcanoPointSelectionModal from './volcanoPointsSelectionModal/volcanoPointsSelectionModal';

const mapStateToProps = (
    state: RootState,
): {
    differentialExpressions: DifferentialExpression[];
    selectedDifferentialExpression: DifferentialExpression;
    highlightedGenesIds: string[];
    selectedGenesIds: string[];
} => {
    return {
        // All available differential expressions
        differentialExpressions: getDifferentialExpressions(state.differentialExpressions),
        // DifferentialExpressions data to be visualized.
        selectedDifferentialExpression: getSelectedDifferentialExpression(
            state.differentialExpressions,
        ),
        // Genes names that are highlighted.
        highlightedGenesIds: getHighlightedGenesIds(state.genes),
        selectedGenesIds: getSelectedGenesIds(state.genes),
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
    selectedDifferentialExpression,
    differentialExpressions,
    highlightedGenesIds,
    selectedGenesIds,
    size: { width },
    connectedDifferentialExpressionSelected,
}: DifferentialExpressionsProps): ReactElement => {
    const differentialExpressionsSelectElement = useRef<HTMLDivElement>(null);
    const [volcanoPointSelectionModalOpened, setVolcanoPointSelectionModalOpened] = useState(false);

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

    const defaultThresholds: Thresholds = useMemo(() => {
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
            _.map(
                data,
                // eslint-disable-next-line no-restricted-globals
                ({ logProbValue }) => isFinite(logProbValue) && logProbValue,
            ),
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

        const tempVolcanoData: Omit<
            VolcanoPoint,
            'logProbFiniteValue'
        >[] = selectedDifferentialExpression.json.gene_id.map((geneId: string, index: number) => {
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

    const handleDifferentialExpressionsOnChange = (
        event: ChangeEvent<{ value: unknown }>,
    ): void => {
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
            default: {
                const errorMessage = `Threshold field ${thresholdField} not recognized`;
                forwardToSentry(errorMessage, new Error(errorMessage));
            }
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
                // variant="outlined"
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
                            differentialExpressions.length === 0
                                ? 'No differential expressions to choose from. Did you select time series?'
                                : ''
                        }
                    >
                        <DifferentialExpressionsFormControl variant="outlined">
                            <InputLabel id="differentialExpressionsDropdownLabel">
                                Differential expression
                            </InputLabel>
                            <Select
                                labelId="differentialExpressionsDropdownLabel"
                                value={
                                    selectedDifferentialExpression != null
                                        ? selectedDifferentialExpression.id
                                        : ''
                                }
                                onChange={handleDifferentialExpressionsOnChange}
                                label="Differential expression"
                                disabled={differentialExpressions.length === 0}
                                ref={differentialExpressionsSelectElement}
                            >
                                {differentialExpressions.map((differentialExpression) => (
                                    <MenuItem
                                        value={differentialExpression.id}
                                        key={differentialExpression.id}
                                    >
                                        {differentialExpression.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </DifferentialExpressionsFormControl>
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
                        />
                    </VolcanoPlotContainer>
                )}
            </DifferentialExpressionsContainer>
            {volcanoPointSelectionModalOpened && (
                <VolcanoPointSelectionModal
                    open={volcanoPointSelectionModalOpened}
                    differentialExpressionName={selectedDifferentialExpression.name}
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
