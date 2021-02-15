import React, { ReactElement, useRef, useCallback, useState, useEffect, forwardRef } from 'react';
import _ from 'lodash';
import { Spec } from 'vega';
import { getMinMax, logOfBase } from 'utils/math';
import { GEN_CYAN, GEN_GREY } from 'components/genexpress/common/theming/theming';
import { Thresholds, VolcanoPoint } from 'redux/models/internal';
import useStateWithEffect from 'components/genexpress/common/useStateWithEffect';
import Chart, { DataDefinition, SignalDefinition } from '../../common/chart/chart';

type DifferentialExpressionsVolcanoPlotProps = {
    data: VolcanoPoint[];
    highlightedGenesIds: string[];
    selectedGenesIds: string[];
    logFcOutliersLimit: number;
    displayOutliers: boolean;
    thresholds: Thresholds;
    probField: string;
    onSelect: (genesIds: string[]) => void;
};

type Range = {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
};

const logFcClampedValueTransform: { type: 'formula'; as: string; expr: string } = {
    // Display range can be narrower than data. Move points into range.
    type: 'formula',
    as: 'logFcClampedValue',
    expr: `clamp(datum.logFcValue, range.minX, range.maxX)`,
};

const getVegaSpecification = (
    data: DifferentialExpressionsVolcanoPlotProps['data'],
    getRange: () => Range,
    thresholds: DifferentialExpressionsVolcanoPlotProps['thresholds'],
    probField: DifferentialExpressionsVolcanoPlotProps['probField'],
    selectedGenePoints: VolcanoPoint[],
    highlightedGenePoints: VolcanoPoint[],
): Spec => ({
    signals: [
        {
            name: 'range',
            value: getRange(),
        },
        {
            name: 'brushing',
            value: false,
            on: [
                {
                    events: 'mousedown, [mousedown, window:mouseup] > window:mousemove',
                    update: 'true',
                },
                {
                    events: '[mousedown, window:mouseup] > mouseup',
                    update: 'false',
                },
            ],
        },
        {
            name: 'brushing_ended',
            value: false,
            on: [
                {
                    events: 'window:mousemove',
                    update: 'false',
                },
                {
                    events: '[mousedown, window:mouseup] > mouseup',
                    update: 'true',
                },
            ],
        },
        {
            name: 'brush_start',
            value: { x: null, y: null },
            on: [
                {
                    events: 'mousedown',
                    update:
                        '{x: invert("xscale", clamp(x(item()), 0, width)), y: invert("yscale", clamp(y(item()), 0, height))}',
                },
            ],
        },
        {
            name: 'brush_end',
            value: { x: null, y: null },
            on: [
                {
                    events: 'mousedown, [mousedown, window:mouseup] > window:mousemove',
                    update:
                        '{x: invert("xscale", clamp(x(item()), 0, width)), y: invert("yscale", clamp(y(item()), 0, height))}',
                },
            ],
        },
    ],
    data: [
        {
            name: 'table',
            values: data,
            transform: [logFcClampedValueTransform],
        },
        {
            name: 'x-thresholds',
            values: [{ x: thresholds.fcLog }, { x: -thresholds.fcLog }],
        },
        {
            name: 'y-thresholds',
            values: [
                {
                    y: thresholds.pValueLog,
                },
            ],
        },
        {
            name: 'highlighted',
            values: highlightedGenePoints,
            transform: [logFcClampedValueTransform],
        },
        {
            name: 'selected',
            values: selectedGenePoints,
            transform: [logFcClampedValueTransform],
        },
        {
            name: 'currentSelection',
            source: 'table',
            transform: [
                {
                    type: 'filter',
                    expr: `inrange(datum.logFcClampedValue, [brush_start.x, brush_end.x]) &&
                   inrange(datum.logProbFiniteValue, [brush_start.y, brush_end.y])`,
                },
            ],
        },
        {
            name: 'selection',
            on: [
                { trigger: '!brushing_ended', remove: true },
                { trigger: 'brushing_ended', insert: `data('currentSelection')` },
            ],
        },
    ],
    marks: [
        {
            name: 'volcanoPointRemaining',
            type: 'symbol',
            from: {
                data: 'table',
            },
            encode: {
                enter: {
                    size: {
                        value: 3 * 3,
                    },
                    fill: {
                        value: GEN_GREY['500'],
                    },
                    tooltip: {
                        signal: `{'Gene': datum.geneId, 'log2(FS)': datum.logFcValue, '${probField}': datum.logProbValue}`,
                    },
                },
                update: {
                    x: {
                        field: 'logFcClampedValue',
                        scale: 'xscale',
                    },
                    y: {
                        field: 'logProbFiniteValue',
                        scale: 'yscale',
                    },
                },
            },
        },
        {
            name: 'volcanoPointSelected',
            type: 'symbol',
            from: {
                data: 'selected',
            },
            encode: {
                enter: {
                    size: {
                        value: 9 * 9,
                    },
                    fill: { value: GEN_GREY['700'] },
                    tooltip: {
                        signal: `{'Gene': datum.geneId, 'log2(FS)': datum.logFcValue, '${probField}': datum.logProbValue}`,
                    },
                },
                update: {
                    x: {
                        field: 'logFcClampedValue',
                        scale: 'xscale',
                    },
                    y: {
                        field: 'logProbFiniteValue',
                        scale: 'yscale',
                    },
                },
            },
        },
        {
            name: 'volcanoPointHighlighted',
            type: 'symbol',
            from: {
                data: 'highlighted',
            },
            encode: {
                enter: {
                    size: {
                        value: 9 * 9,
                    },
                    fill: {
                        value: GEN_CYAN['500'],
                    },
                    tooltip: {
                        signal: `{'Gene': datum.geneId, 'log2(FS)': datum.logFcValue, '${probField}': datum.logProbValue}`,
                    },
                },
                update: {
                    x: {
                        field: 'logFcClampedValue',
                        scale: 'xscale',
                    },
                    y: {
                        field: 'logProbFiniteValue',
                        scale: 'yscale',
                    },
                },
            },
        },
        {
            name: 'selectionRect',
            type: 'rect',
            encode: {
                enter: {
                    stroke: {
                        value: GEN_GREY['500'],
                    },
                },
                update: {
                    x: {
                        scale: 'xscale',
                        signal: 'brush_start.x',
                    },
                    x2: {
                        scale: 'xscale',
                        signal: 'brush_end.x',
                    },
                    y: {
                        scale: 'yscale',
                        signal: 'brush_start.y',
                    },
                    y2: {
                        scale: 'yscale',
                        signal: 'brush_end.y',
                    },
                    stroke: {
                        value: GEN_GREY['500'],
                    },
                    strokeWidth: [
                        {
                            value: 1,
                            test: 'brushing === true',
                        },
                        {
                            value: 0,
                        },
                    ],
                },
            },
        },
        {
            name: 'xThresholdsRect',
            type: 'rect',
            from: {
                data: 'x-thresholds',
            },
            encode: {
                enter: {
                    width: {
                        value: 1,
                    },
                    fill: {
                        value: GEN_GREY['700'],
                    },
                },
                update: {
                    x: {
                        scale: 'xscale',
                        field: 'x',
                    },
                    y: {
                        value: 0,
                    },
                    y2: {
                        signal: 'height',
                    },
                },
            },
        },
        {
            name: 'yThresholdsRect',
            type: 'rect',
            from: {
                data: 'y-thresholds',
            },
            encode: {
                enter: {
                    height: {
                        value: 1,
                    },
                    fill: {
                        value: GEN_GREY['700'],
                    },
                },
                update: {
                    x: {
                        scale: 'xscale',
                        signal: 'range.minX',
                    },
                    x2: {
                        scale: 'xscale',
                        signal: 'range.maxX',
                    },
                    y: {
                        scale: 'yscale',
                        field: 'y',
                    },
                },
            },
        },
    ],
    scales: [
        {
            name: 'xscale',
            type: 'linear',
            domain: [{ signal: 'range.minX' }, { signal: 'range.maxX' }],
            range: 'width',
        },
        {
            name: 'yscale',
            type: 'linear',
            domain: [{ signal: 'range.minY' }, { signal: 'range.maxY' }],
            range: 'height',
        },
    ],
    axes: [
        {
            scale: 'xscale',
            // TODO: once https://github.com/vega/vega/issues/2927 is fixed, return label orientation back to bottom!
            orient: 'top',
            title: 'log2(Fold Change)',
            grid: true,
            encode: {
                labels: {
                    update: {
                        dy: { value: 5 },
                        align: { value: 'center' },
                    },
                },
                title: {
                    update: { dy: { value: 9 } },
                },
            },
        },
        {
            scale: 'yscale',
            orient: 'left',
            title: `-log10(${probField})`,
            grid: true,
            encode: {
                labels: {
                    update: {
                        dx: { value: -8 },
                        align: { value: 'center' },
                    },
                },
                title: {
                    update: { dx: { value: -12 } },
                },
            },
        },
    ],
});

const DifferentialExpressionsVolcanoPlot = forwardRef(
    (
        {
            data,
            highlightedGenesIds,
            selectedGenesIds,
            logFcOutliersLimit,
            displayOutliers = false,
            thresholds,
            probField,
            onSelect,
        }: DifferentialExpressionsVolcanoPlotProps,
        ref,
    ): ReactElement => {
        const [highlightedGenePoints, setHighlightedGenePoints] = useState<VolcanoPoint[]>([]);
        const [selectedGenePoints, setSelectedGenePoints] = useState<VolcanoPoint[]>([]);

        useEffect(() => {
            setHighlightedGenePoints(
                _.filter(data, (datum) => highlightedGenesIds.includes(datum.geneId)),
            );
        }, [data, highlightedGenesIds]);

        useEffect(() => {
            setSelectedGenePoints(
                _.filter(data, (datum) => selectedGenesIds.includes(datum.geneId)),
            );
        }, [data, selectedGenesIds]);

        const getLogProbLimit = useCallback((): number => {
            const HIGHEST_CALCULABLE_LOG_PROB = -logOfBase(Number.MIN_VALUE, 10);
            if (_.isEmpty(data)) return HIGHEST_CALCULABLE_LOG_PROB;

            const highestValueInData = _.max(
                _.map(
                    data,
                    // eslint-disable-next-line no-restricted-globals
                    ({ logProbValue }) => isFinite(logProbValue) && logProbValue,
                ),
            );

            return highestValueInData
                ? Math.min(HIGHEST_CALCULABLE_LOG_PROB, highestValueInData * 1.1)
                : 0;
        }, [data]);

        const getRange = useCallback((): Range => {
            const [minY, maxY] = getMinMax(data.map((datum) => datum.logProbFiniteValue));
            const expandedY = Math.min(maxY * 1.1, getLogProbLimit()); // Expand the range by 10%.

            const [minX, maxX] = getMinMax(data.map((datum) => datum.logFcValue));
            const absMaxX = Math.max(Math.abs(minX), Math.abs(maxX));

            const expandedX = absMaxX + absMaxX * 2 * 0.1; // Expand the range by 10%.
            const usedX = !displayOutliers ? Math.min(expandedX, logFcOutliersLimit) : expandedX;

            return {
                minX: _.floor(-usedX, 2),
                maxX: _.ceil(usedX, 2),
                minY: _.floor(minY, 2),
                maxY: _.ceil(expandedY, 2),
            };
        }, [data, displayOutliers, getLogProbLimit, logFcOutliersLimit]);

        const updatableDataDefinitions: DataDefinition[] = useStateWithEffect(
            () => [
                {
                    name: 'highlighted',
                    data: highlightedGenePoints,
                },
                {
                    name: 'selected',
                    data: selectedGenePoints,
                },
                { name: 'table', data },
                { name: 'x-thresholds', data: [{ x: thresholds.fcLog }, { x: -thresholds.fcLog }] },
                { name: 'y-thresholds', data: [{ y: thresholds.pValueLog }] },
            ],
            [
                data,
                highlightedGenePoints,
                selectedGenePoints,
                thresholds.fcLog,
                thresholds.pValueLog,
            ],
        );

        const updatableSignalDefinitions: SignalDefinition[] = useStateWithEffect(
            () => [
                {
                    name: 'range',
                    value: getRange(),
                },
            ],
            [getRange],
        );

        // Data handlers that is updated (and reattached) only if highlighted variable changes.
        const dataHandlers = useStateWithEffect(
            () => [
                {
                    name: 'selection',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    handler: (_name: string, value: any): void => {
                        if (value != null && value.length > 0) {
                            const selectedVolcanoPoints = value.map(
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (volcanoPointObject: { geneId: string }) =>
                                    volcanoPointObject.geneId,
                            );
                            onSelect(selectedVolcanoPoints);
                        }
                    },
                },
            ],
            [onSelect],
        );

        const renderSpecification = useRef<Spec>(
            getVegaSpecification(
                data,
                getRange,
                thresholds,
                probField,
                selectedGenePoints,
                highlightedGenePoints,
            ),
        );

        return (
            <Chart
                updatableDataDefinitions={updatableDataDefinitions}
                updatableSignalDefinitions={updatableSignalDefinitions}
                dataHandlers={dataHandlers}
                vegaSpecification={renderSpecification.current}
                ref={ref}
            />
        );
    },
);

export default DifferentialExpressionsVolcanoPlot;
