import React, { ReactElement, useRef, forwardRef, useState, useEffect } from 'react';
import { Spec } from 'vega';
import { GEN_CYAN, GEN_GREY } from 'components/genexpress/common/theming/theming';
import { ClusterNode, GeneExpression } from 'redux/models/internal';
import useForwardedRef from 'components/genexpress/common/useForwardedRef';
import _ from 'lodash';
import useStateWithEffect from 'components/genexpress/common/useStateWithEffect';
import Chart, { ChartHandle, DataDefinition, SignalDefinition } from '../../common/chart/chart';

type ClusteringChartProps = {
    clusterNodes: ClusterNode[];
    genesExpressions: GeneExpression[];
    highlightedClusterNodesIds: number[];
    onHighlightedChanged: (highlightedClusterNodesIds: number[]) => void;
};

type WrappedNodeIndex = { nodeIndex: number };

export const clusterLineWidth = 2;
export const color = GEN_GREY['700'];
export const highlightedColor = GEN_CYAN['500'];
const heatmapRectWidth = 10;
const heatmapRectHeight = 20;

const getVegaSpecification = (
    clusterNodes: ClusteringChartProps['clusterNodes'],
    genesExpressions: ClusteringChartProps['genesExpressions'],
    getDendrogramWidth: () => number,
    wrappedHighlightedClusterNodesIds: WrappedNodeIndex[],
): Spec => ({
    signals: [
        {
            name: 'ctrl',
            value: false,
            on: [
                {
                    events:
                        '@horizontalLines:click, @verticalLines:click, @genesExpressionsHeatmap:click, @genesNames:click',
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
                        '@horizontalLines:click, @verticalLines:click, @genesExpressionsHeatmap:click, @genesNames:click',
                    update: '{nodeIndex: datum.nodeIndex}',
                    force: true,
                },
            ],
        },
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
            name: 'dendrogramWidth',
            value: [0, getDendrogramWidth()],
            on: [
                {
                    events: { signal: 'width' },
                    update: `[0, width - heatmapWidth - 30]`,
                    force: true,
                },
                {
                    events: { signal: 'heatmapWidth' },
                    update: `[0, width - heatmapWidth - 30]`,
                    force: true,
                },
            ],
        },
        {
            name: 'heatmapWidth',
            value: 0,
        },
        {
            name: 'hovered',
            value: null,
            on: [
                {
                    events:
                        '@horizontalLines:mouseover, @verticalLines:mouseover, @genesExpressionsHeatmap:mouseover, @genesNames:mouseover',
                    update: '{nodeIndex: datum.nodeIndex}',
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
                        '@horizontalLines:mouseout, @verticalLines:mouseout, @genesExpressionsHeatmap:mouseout, @genesNames:mouseout',
                    update: '{}',
                    force: true,
                },
            ],
        },
    ],
    data: [
        {
            name: 'genesExpressionsTable',
            values: genesExpressions,
        },
        {
            name: 'nodesTable',
            values: clusterNodes,
        },
        {
            name: 'highlightedClusterNodesIds',
            values: wrappedHighlightedClusterNodesIds,
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
        {
            name: 'leafNodesTable',
            source: 'nodesTable',
            transform: [
                {
                    type: 'filter',
                    expr: 'datum.gene != null',
                },
            ],
        },
        {
            name: 'leafNodesExpressionsTable',
            source: 'leafNodesTable',
            transform: [
                {
                    type: 'flatten',
                    index: 'expressionIndex',
                    fields: ['expressions'],
                    as: ['expression'],
                },
                {
                    type: 'formula',
                    as: 'expressionOffset',
                    expr: `datum.expressionIndex * ${heatmapRectWidth}`,
                },
            ],
        },
        {
            name: 'hovered',
            on: [
                { trigger: 'hovered', insert: 'hovered' },
                { trigger: 'unhovered', remove: true },
            ],
        },
    ],
    marks: [
        {
            name: 'horizontalLines',
            type: 'rect',
            from: {
                data: 'nodesTable',
            },
            encode: {
                enter: {
                    x: { field: 'x', scale: 'xscale' },
                    x2: { field: 'parent.x', scale: 'xscale' },
                    y: { field: 'y', scale: 'yscale' },
                    fill: {
                        value: color,
                    },
                    cursor: { value: 'pointer' },
                    // Expand clickable area with transparent stroke.
                    stroke: {
                        value: '#FFFFFF',
                    },
                    strokeOpacity: { value: 0.0001 },
                    strokeWidth: { value: 5 },
                },
                update: {
                    height: [
                        {
                            test:
                                "indata('highlightedClusterNodesIds', 'nodeIndex', datum.nodeIndex)",
                            value: clusterLineWidth * 2,
                        },
                        { value: clusterLineWidth },
                    ],
                    fill: [
                        {
                            test:
                                "indata('highlightedClusterNodesIds', 'nodeIndex', datum.nodeIndex) || indata('hovered', 'nodeIndex', datum.nodeIndex)",
                            value: highlightedColor,
                        },
                        { value: color },
                    ],
                },
            },
        },
        {
            name: 'verticalLines',
            type: 'rect',
            from: {
                data: 'nodesTable',
            },
            encode: {
                enter: {
                    x: { field: 'parent.x', scale: 'xscale' },
                    y: { field: 'y', scale: 'yscale' },
                    y2: { field: 'parent.y', scale: 'yscale' },
                    cursor: { value: 'pointer' },
                    // Expand clickable area with transparent stroke.
                    stroke: {
                        value: '#FFFFFF',
                    },
                    strokeOpacity: { value: 0.0001 },
                    strokeWidth: { value: 5 },
                },
                update: {
                    width: [
                        {
                            test:
                                "indata('highlightedClusterNodesIds', 'nodeIndex', datum.nodeIndex)",
                            value: clusterLineWidth * 2,
                        },
                        { value: clusterLineWidth },
                    ],
                    fill: [
                        {
                            test:
                                "indata('highlightedClusterNodesIds', 'nodeIndex', datum.nodeIndex) || indata('hovered', 'nodeIndex', datum.nodeIndex)",
                            value: highlightedColor,
                        },
                        { value: color },
                    ],
                },
            },
        },
        {
            name: 'genesNames',
            type: 'text',
            from: {
                data: 'leafNodesTable',
            },
            encode: {
                enter: {
                    x: {
                        field: 'x',
                        scale: 'xscale',
                        offset: { signal: 'heatmapWidth', offset: 10 },
                    },
                    y: { field: 'y', scale: 'yscale', offset: 4 },
                    align: { value: 'left' },
                    text: { field: 'gene.name' },
                    fill: { value: color },
                    fontSize: { value: 11 },
                },
            },
        },
        {
            type: 'rect',
            name: 'genesExpressionsHeatmap',
            from: { data: 'leafNodesExpressionsTable' },
            encode: {
                enter: {
                    x: {
                        scale: 'xscale',
                        field: 'x',
                        offset: { field: 'expressionOffset' },
                    },
                    y: { scale: 'yscale', field: 'y', offset: -heatmapRectHeight / 2 },
                    width: { value: heatmapRectWidth },
                    height: { value: heatmapRectHeight },
                    tooltip: {
                        signal: "{'Time': datum.expression.label, 'Level': datum.expression.value}",
                    },
                },
                update: {
                    fill: {
                        scale: 'heatmapColor',
                        field: 'expression.value',
                    },
                },
            },
        },
    ],
    scales: [
        {
            name: 'xscale',
            type: 'linear',
            range: { signal: 'dendrogramWidth' },
            domain: { data: 'nodesTable', field: 'x' },
        },
        {
            name: 'yscale',
            type: 'linear',
            range: 'height',
            domain: { data: 'nodesTable', field: 'y' },
        },
        {
            name: 'heatmapColor',
            type: 'linear',
            range: { scheme: 'Viridis' },
            domain: { data: 'genesExpressionsTable', field: 'value' },
        },
    ],
    axes: [],
});

const ClusteringChart = forwardRef<ChartHandle, ClusteringChartProps>(
    (
        {
            clusterNodes,
            genesExpressions,
            highlightedClusterNodesIds,
            onHighlightedChanged,
        }: ClusteringChartProps,
        forwardedRef,
    ): ReactElement => {
        const chartRef = useForwardedRef<ChartHandle>(forwardedRef);
        const [heatmapWidth, setHeatmapWidth] = useState(0);
        const [wrappedHighlightedClusterNodesIds, setWrappedHighlightedClusterNodesIds] = useState<
            WrappedNodeIndex[]
        >([]);

        const getDendrogramWidth = (): number => {
            const chartDivElement = chartRef.current?.getChartDivElement();
            return chartDivElement != null ? chartDivElement.clientWidth - heatmapWidth : 0;
        };

        /**
         * Because Vega ignores value 0, we must wrap cluster node indexes to an object.
         * Use this type of notation for all data that can include "empty" values (e.g. 0, '').
         */
        useEffect(() => {
            setWrappedHighlightedClusterNodesIds(
                highlightedClusterNodesIds.map((id) => ({
                    nodeIndex: id,
                })),
            );
        }, [highlightedClusterNodesIds]);

        // HeatmapWidth must be calculated from rect width and number of labels to display.
        useEffect(() => {
            setHeatmapWidth(
                (genesExpressions.filter(
                    (geneExpression) => geneExpression.geneId === genesExpressions[0]?.geneId,
                ).length ?? 0) * heatmapRectWidth,
            );
        }, [genesExpressions]);

        const updatableDataDefinitions: DataDefinition[] = useStateWithEffect(
            () => [
                {
                    name: 'highlightedClusterNodesIds',
                    data: wrappedHighlightedClusterNodesIds,
                },
                { name: 'nodesTable', data: clusterNodes },
                { name: 'genesExpressionsTable', data: genesExpressions },
            ],
            [clusterNodes, genesExpressions, wrappedHighlightedClusterNodesIds],
        );

        const updatableSignalDefinitions: Array<SignalDefinition> = useStateWithEffect(
            () => [
                {
                    name: 'heatmapWidth',
                    value: heatmapWidth,
                },
            ],
            [heatmapWidth],
        );

        const dataHandlers = useStateWithEffect(
            () => [
                {
                    name: 'highlightedClusterNodesIds',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    handler: (_name: string, value: any): void => {
                        if (value != null && value.length > 0) {
                            const chartHighlightedClusterNodesIds = value.map(
                                (vegaObject: { nodeIndex: string }) => vegaObject.nodeIndex,
                            );
                            if (
                                _.xor(chartHighlightedClusterNodesIds, highlightedClusterNodesIds)
                                    .length > 0
                            ) {
                                onHighlightedChanged(chartHighlightedClusterNodesIds);
                            }
                        } else if (highlightedClusterNodesIds.length > 0) {
                            onHighlightedChanged([]);
                        }
                    },
                },
            ],
            [highlightedClusterNodesIds, onHighlightedChanged],
        );

        const renderSpecification = useRef<Spec>(
            getVegaSpecification(
                clusterNodes,
                genesExpressions,
                getDendrogramWidth,
                wrappedHighlightedClusterNodesIds,
            ),
        );

        return (
            <Chart
                updatableDataDefinitions={updatableDataDefinitions}
                updatableSignalDefinitions={updatableSignalDefinitions}
                dataHandlers={dataHandlers}
                vegaSpecification={renderSpecification.current}
                ref={chartRef}
            />
        );
    },
);

export default ClusteringChart;
