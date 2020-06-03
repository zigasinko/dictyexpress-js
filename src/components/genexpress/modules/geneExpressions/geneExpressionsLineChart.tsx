import React, { ReactElement, useRef, useMemo } from 'react';
import _ from 'lodash';
import { Spec } from 'vega';
import { GeneVisualizationData } from 'redux/models/internal';
import Chart, { DataDefinition } from 'components/genexpress/common/chart/chart';

type LineChartVegaProps = {
    data: Array<GeneVisualizationData>;
    highlighted: string[];
    onHighlight: (genesNames: string[]) => void;
};

const GeneExpressionsLineChart: React.FunctionComponent<LineChartVegaProps> = ({
    data,
    highlighted,
    onHighlight,
}: LineChartVegaProps): ReactElement => {
    const updatableDataDefinitions: Array<DataDefinition> = useMemo(
        () => [
            {
                name: 'highlighted',
                data: highlighted,
            },
            { name: 'table', data },
        ],
        [data, highlighted],
    );

    // Data handlers that is updated (and reattached) only if highlighted variable changes.
    const dataHandlers = useMemo(
        () => [
            {
                name: 'highlighted',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                handler: (name: string, value: any): void => {
                    if (value != null && value.length > 0) {
                        const highlightedGenesNames = value.map(
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (geneNameObject: { data: any }) => geneNameObject.data,
                        );
                        if (_.difference(highlightedGenesNames, highlighted).length > 0) {
                            onHighlight(highlightedGenesNames);
                        }
                    } else if (highlighted.length > 0) {
                        onHighlight([]);
                    }
                },
            },
        ],
        [highlighted, onHighlight],
    );

    const renderSpecification = useRef<Spec>({
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
                        events:
                            '@genesExpressionsLines:click, @legendSymbol:click, @legendLabel:click',
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
                        events:
                            '@genesExpressionsLines:click, @legendSymbol:click, @legendLabel:click',
                        update: 'datum.geneName == null ? datum.value : datum.geneName',
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
                        update: '{geneName: datum.geneName == null ? datum.value : datum.geneName}',
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
                values: highlighted,
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
                                        "indata('hovered', 'geneName', datum.value) || indata('highlighted', 'data', datum.value)",
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
                        groupby: 'geneName',
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
                                stroke: { scale: 'colorscale', field: 'geneName' },
                                strokeWidth: { value: 2 },
                                tooltip: {
                                    signal:
                                        "{'Gene name': datum.geneName, 'Time': datum.x, 'Score': datum.y}",
                                },
                            },
                            update: {
                                strokeWidth: [
                                    {
                                        test:
                                            "indata('hovered', 'geneName', datum.geneName) || indata('highlighted', 'data', datum.geneName)",
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
                                fill: { scale: 'colorscale', field: 'geneName' },
                                stroke: { scale: 'colorscale', field: 'geneName' },
                                strokeWidth: { value: 1 },
                                tooltip: {
                                    signal:
                                        "{'Gene name': datum.geneName, 'Time': datum.x, 'Score': datum.y}",
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
                domain: { data: 'table', field: 'geneName' },
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

    return (
        <Chart
            updatableDataDefinitions={updatableDataDefinitions}
            dataHandlers={dataHandlers}
            vegaSpecification={renderSpecification.current}
        />
    );
};

export default GeneExpressionsLineChart;
