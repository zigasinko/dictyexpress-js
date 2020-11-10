import React, { ReactElement, useRef, forwardRef } from 'react';
import _ from 'lodash';
import { Spec } from 'vega';
import useStateWithEffect from 'components/genexpress/common/useStateWithEffect';
import Chart, { DataDefinition, DataHandler } from '../../common/chart/chart';

export type GeneVisualizationData = {
    x: string;
    y: number;
    geneId: string;
};

type GeneExpressionsLineChartProps = {
    data: GeneVisualizationData[];
    highlightedGenesIds: string[];
    onHighlight: (genesIds: string[]) => void;
};

const getVegaSpecification = (
    data: GeneExpressionsLineChartProps['data'],
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
                        '@legendSymbol:mouseover, @legendLabel:mouseover, @genesExpressionsLines:mouseover, @geneExpressionsPoints:mouseover',
                    update: '{geneId: datum.geneId == null ? datum.value : datum.geneId}',
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
                        '@legendSymbol:mouseout, @legendLabel:mouseout, @genesExpressionsLines:mouseout, @geneExpressionsPoints:mouseout',
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
            values: data,
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
                    toggle: 'clicked',
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
                        fontWeight: [
                            {
                                test:
                                    "indata('hovered', 'geneId', datum.value) || indata('highlighted', 'data', datum.value)",
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
                            x: { scale: 'xscale', field: 'x' },
                            y: { scale: 'yscale', field: 'y' },
                            stroke: { scale: 'colorscale', field: 'geneId' },
                            strokeWidth: { value: 2 },
                        },
                        update: {
                            strokeWidth: [
                                {
                                    test:
                                        "indata('hovered', 'geneId', datum.geneId) || indata('highlighted', 'data', datum.geneId)",
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
                    name: 'geneExpressionsPoints',
                    from: { data: 'series' },
                    encode: {
                        enter: {
                            x: { scale: 'xscale', field: 'x' },
                            y: { scale: 'yscale', field: 'y' },
                            fill: { scale: 'colorscale', field: 'geneId' },
                            stroke: { scale: 'colorscale', field: 'geneId' },
                            strokeWidth: { value: 1 },
                            tooltip: {
                                signal: "{'Gene': datum.geneId, 'Time': datum.x, 'Score': datum.y}",
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
            domain: { data: 'table', field: 'x' },
        },
        {
            name: 'yscale',
            type: 'linear',
            range: 'height',
            nice: true,
            zero: true,
            domain: { data: 'table', field: 'y' },
        },
        {
            name: 'colorscale',
            type: 'ordinal',
            range: 'category',
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
        { data, highlightedGenesIds, onHighlight }: GeneExpressionsLineChartProps,
        ref,
    ): ReactElement => {
        const updatableDataDefinitions: DataDefinition[] = useStateWithEffect<DataDefinition[]>(
            () => [
                {
                    name: 'highlighted',
                    data: highlightedGenesIds,
                },
                { name: 'table', data },
            ],
            [data, highlightedGenesIds],
        );

        // Data handlers that is updated (and reattached) only if highlighted variable changes.
        const dataHandlers = useStateWithEffect<DataHandler[]>(
            () => [
                {
                    name: 'highlighted',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    handler: (name: string, value: any): void => {
                        if (value != null && value.length > 0) {
                            const selectedGenesIds = value.map(
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (geneNameObject: { data: any }) => geneNameObject.data,
                            );
                            if (_.difference(selectedGenesIds, highlightedGenesIds).length > 0) {
                                onHighlight(selectedGenesIds);
                            }
                        } else if (highlightedGenesIds.length > 0) {
                            onHighlight([]);
                        }
                    },
                },
            ],
            [highlightedGenesIds, onHighlight],
        );

        const renderSpecification = useRef<Spec>(getVegaSpecification(data, highlightedGenesIds));

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
