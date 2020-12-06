import React, { ReactElement, useRef, forwardRef } from 'react';
import _ from 'lodash';
import { Spec } from 'vega';
import useStateWithEffect from 'components/genexpress/common/useStateWithEffect';
import { GeneExpression } from 'redux/models/internal';
import Chart, { DataDefinition, DataHandler } from '../../common/chart/chart';

type GeneExpressionsLineChartProps = {
    genesExpressions: GeneExpression[];
    highlightedGenesIds: string[];
    onHighlight: (genesIds: string[]) => void;
};

const getVegaSpecification = (
    genesExpressions: GeneExpressionsLineChartProps['genesExpressions'],
    highlightedGenesIds: GeneExpressionsLineChartProps['highlightedGenesIds'],
): Spec => ({
    signals: [
        {
            name: 'clear',
            value: true,
            on: [
                {
                    events: 'mouseup[!event.item]',
                    update: 'true',
                    force: true,
                },
            ],
        },
        {
            name: 'ctrl',
            value: false,
            on: [
                {
                    events: '@genesExpressionsLines:click, @legendSymbol:click, @legendLabel:click',
                    update: 'event.ctrlKey',
                    force: true,
                },
            ],
        },
        {
            name: 'clicked',
            value: null,
            on: [
                {
                    events: '@genesExpressionsLines:click, @legendSymbol:click, @legendLabel:click',
                    update: 'datum.geneId == null ? datum.value : datum.geneId',
                    force: true,
                },
            ],
        },
        {
            name: 'hovered',
            value: null,
            on: [
                {
                    events:
                        '@legendSymbol:mouseover, @legendLabel:mouseover, @genesExpressionsLines:mouseover, @genesExpressionsPoints:mouseover',
                    update: 'datum.geneId == null ? datum.value : datum.geneId',
                    force: true,
                },
            ],
        },
        {
            name: 'unhovered',
            value: null,
            on: [
                {
                    events:
                        '@legendSymbol:mouseout, @legendLabel:mouseout, @genesExpressionsLines:mouseout, @genesExpressionsPoints:mouseout',
                    update: '{}',
                    force: true,
                },
            ],
        },
    ],
    data: [
        {
            name: 'table',
            transform: [],
            values: genesExpressions,
        },
        {
            name: 'hovered',
            on: [
                { trigger: 'hovered', insert: 'hovered' },
                { trigger: 'unhovered', remove: true },
            ],
        },
        {
            name: 'highlighted',
            values: highlightedGenesIds,
            on: [
                { trigger: 'clear', remove: true },
                { trigger: '!ctrl', remove: true },
                {
                    trigger: '!ctrl && clicked',
                    insert: 'clicked',
                },
                {
                    trigger: 'ctrl && clicked',
                    toggle: '{data: clicked}',
                },
            ],
        },
    ],
    legends: [
        {
            title: 'Genes',
            stroke: 'colorscale',
            orient: 'right',
            legendX: 0,
            encode: {
                symbols: {
                    name: 'legendSymbol',
                    interactive: true,
                },
                labels: {
                    name: 'legendLabel',
                    interactive: true,
                    update: {
                        text: { scale: 'geneLookup', field: 'value' },
                        fontWeight: [
                            {
                                test:
                                    "indata('highlighted', 'data', datum.value) || indata('hovered', 'data', datum.value)",
                                value: 'bold',
                            },
                            { value: 'normal' },
                        ],
                    },
                },
            },
        },
    ],
    marks: [
        {
            type: 'group',
            from: {
                facet: {
                    name: 'series',
                    data: 'table',
                    groupby: 'geneId',
                },
            },
            marks: [
                {
                    type: 'line',
                    name: 'genesExpressionsLines',
                    from: { data: 'series' },
                    encode: {
                        enter: {
                            x: { scale: 'xscale', field: 'label' },
                            y: { scale: 'yscale', field: 'value' },
                            stroke: { scale: 'colorscale', field: 'geneId' },
                            strokeWidth: { value: 2 },
                        },
                        update: {
                            strokeWidth: [
                                {
                                    test:
                                        "indata('highlighted', 'data', datum.geneId) || indata('hovered', 'data', datum.geneId)",
                                    value: 4,
                                },
                                { value: 2 },
                            ],
                            cursor: { value: 'pointer' },
                        },
                    },
                },
                {
                    type: 'symbol',
                    name: 'genesExpressionsPoints',
                    from: { data: 'series' },
                    encode: {
                        enter: {
                            x: { scale: 'xscale', field: 'label' },
                            y: { scale: 'yscale', field: 'value' },
                            fill: { scale: 'colorscale', field: 'geneId' },
                            stroke: { scale: 'colorscale', field: 'geneId' },
                            strokeWidth: { value: 1 },
                            tooltip: {
                                signal:
                                    "{'Gene': datum.geneName, 'Time': datum.label, 'Score': datum.value}",
                            },
                        },
                    },
                },
            ],
        },
    ],
    scales: [
        {
            name: 'xscale',
            type: 'point',
            range: 'width',
            domain: { data: 'table', field: 'label' },
        },
        {
            name: 'yscale',
            type: 'linear',
            range: 'height',
            nice: true,
            zero: true,
            domain: { data: 'table', field: 'value' },
        },
        {
            name: 'colorscale',
            type: 'ordinal',
            range: 'category',
            domain: { data: 'table', field: 'geneId' },
        },
        {
            name: 'geneLookup',
            type: 'ordinal',
            range: { data: 'table', field: 'geneName' },
            domain: { data: 'table', field: 'geneId' },
        },
    ],
    axes: [
        {
            scale: 'xscale',
            orient: 'bottom',
            title: 'Time [hrs]',
            tickOffset: 0,
        },
        {
            title: 'RPKM',
            grid: true,
            orient: 'left',
            scale: 'yscale',
        },
    ],
});

const GeneExpressionsLineChart = forwardRef(
    (
        { genesExpressions, highlightedGenesIds, onHighlight }: GeneExpressionsLineChartProps,
        ref,
    ): ReactElement => {
        const updatableDataDefinitions: DataDefinition[] = useStateWithEffect<DataDefinition[]>(
            () => [
                {
                    name: 'highlighted',
                    data: highlightedGenesIds,
                },
                { name: 'table', data: genesExpressions },
            ],
            [genesExpressions, highlightedGenesIds],
        );

        // Data handlers that is updated (and reattached) only if highlighted variable changes.
        const dataHandlers = useStateWithEffect<DataHandler[]>(
            () => [
                {
                    name: 'highlighted',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    handler: (_name: string, value: any): void => {
                        if (value != null && value.length > 0) {
                            const chartHighlightedGenesIds = value.map(
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (geneIdObject: { data: any }) => geneIdObject.data,
                            );
                            if (_.xor(chartHighlightedGenesIds, highlightedGenesIds).length > 0) {
                                onHighlight(chartHighlightedGenesIds);
                            }
                        } else if (highlightedGenesIds.length > 0) {
                            onHighlight([]);
                        }
                    },
                },
            ],
            [highlightedGenesIds, onHighlight],
        );

        const renderSpecification = useRef<Spec>(
            getVegaSpecification(genesExpressions, highlightedGenesIds),
        );

        return (
            <Chart
                updatableDataDefinitions={updatableDataDefinitions}
                dataHandlers={dataHandlers}
                vegaSpecification={renderSpecification.current}
                ref={ref}
            />
        );
    },
);

export default GeneExpressionsLineChart;
