import React, { ReactElement, useEffect, useState, ChangeEvent, useRef, useCallback } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import _ from 'lodash';
import { getSelectedGenesExpressions, RootState } from 'redux/rootReducer';
import { genesHighlighted, getHighlightedGenesIds, getSelectedGenes } from 'redux/stores/genes';
import { ClusterNode, Option } from 'redux/models/internal';
import { MenuItem, Tooltip } from '@material-ui/core';
import DictySelect from 'components/genexpress/common/dictySelect/dictySelect';
import { objectsArrayToTsv } from 'utils/reportUtils';
import useReport from 'components/genexpress/common/reportBuilder/useReport';
import {
    clusteringDistanceMeasureChanged,
    getClusteringDistanceMeasure,
    getClusteringLinkageFunction,
    getMergedClusteringData,
    clusteringLinkageFunctionChanged,
} from 'redux/stores/clustering';
import { advancedJoin } from 'utils/arrayUtils';
import { ChartHandle } from 'components/genexpress/common/chart/chart';
import { DistanceMeasure, ClusteringLinkageFunction } from 'components/genexpress/common/constants';
import {
    ClusteringChartContainer,
    ClusteringContainer,
    ClusteringControl,
    ClusteringControls,
} from './clustering.styles';
import ClusteringChart from './clusteringChart';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mapStateToProps = (state: RootState) => {
    return {
        mergedData: getMergedClusteringData(state.clustering),
        distanceMeasure: getClusteringDistanceMeasure(state.clustering),
        linkageFunction: getClusteringLinkageFunction(state.clustering),
        highlightedGenesIds: getHighlightedGenesIds(state.genes),
        selectedGenes: getSelectedGenes(state.genes),
        genesExpressions: getSelectedGenesExpressions(state),
    };
};

const connector = connect(mapStateToProps, {
    connectedGenesHighlighted: genesHighlighted,
    connectedDistanceMeasureChanged: clusteringDistanceMeasureChanged,
    connectedLinkageFunctionChanged: clusteringLinkageFunctionChanged,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

export const distanceMeasureOptions: Option<DistanceMeasure>[] = [
    { value: DistanceMeasure.pearson, label: 'Pearson' },
    { value: DistanceMeasure.spearman, label: 'Spearman' },
];

export const linkageFunctionOptions: Option<ClusteringLinkageFunction>[] = [
    { value: ClusteringLinkageFunction.single, label: 'Single' },
    { value: ClusteringLinkageFunction.average, label: 'Average' },
    { value: ClusteringLinkageFunction.complete, label: 'Complete' },
];

const Clustering = ({
    mergedData,
    genesExpressions,
    distanceMeasure,
    linkageFunction,
    selectedGenes,
    highlightedGenesIds,
    connectedGenesHighlighted,
    connectedDistanceMeasureChanged,
    connectedLinkageFunctionChanged,
}: PropsFromRedux): ReactElement => {
    const chartRef = useRef<ChartHandle>(null);

    const [clusterNodes, setClusterNodes] = useState<ClusterNode[]>([]);
    const [highlightedClusterNodesIds, setHighlightedClusterNodesIds] = useState<number[]>([]);

    useEffect(() => {
        if (mergedData == null) {
            setClusterNodes([]);
            return;
        }

        const intermediateTable: { [nodeIndex: number]: ClusterNode } = {};
        const max = (_.max(mergedData.linkage.map((linkage) => linkage.distance)) as number) * 100;

        // Leaf nodes (with genes).
        _.each(mergedData.order, ({ nodeIndex, order, gene }) => {
            intermediateTable[nodeIndex] = {
                nodeIndex,
                x: max,
                // First element has order=0, that's why order value needs to be inverted
                // so that first element is shown at the top.
                y: (mergedData.order.length - order) * 100,
                gene,
                expressions: genesExpressions.filter(
                    (geneExpression) => geneExpression.geneId === gene.feature_id,
                ),
            };
        });

        _.each(mergedData.linkage, ({ nodeIndex, node1, node2, distance }) => {
            const middle = (intermediateTable[node1].y + intermediateTable[node2].y) / 2;
            intermediateTable[nodeIndex] = {
                nodeIndex,
                x: max - distance * 100,
                y: middle,
                gene: undefined,
            };
            intermediateTable[node1].parent = intermediateTable[nodeIndex];
            intermediateTable[node2].parent = intermediateTable[nodeIndex];
        });

        // Remove last parentless element and set cluster nodes to chart.
        setClusterNodes(
            _.reject(_.values(intermediateTable), (item) => _.isUndefined(item.parent)),
        );
    }, [genesExpressions, mergedData]);

    useEffect(() => {
        /* ClusterNode is highlighted if:
         * - all it's children lead to leafs with highlighted genes.
         * - it's gene is among highlighted genes (if node has a gene, it's a leaf node).
         */
        if (!_.isEmpty(clusterNodes)) {
            const getAllHighlighted = (
                highlightedNodes: ClusterNode[],
                allHighlightedNodes = [...highlightedNodes],
            ): ClusterNode[] => {
                const highlightedParentNodes = [] as ClusterNode[];
                const groupedByParent = _.groupBy(
                    // Exclude nodes without a parent.
                    highlightedNodes.filter((node) => node.parent),
                    (node) => node.parent?.nodeIndex,
                );
                // For each highlighted node, check if all it's siblings are also highlighted
                // and mark parent.
                _.map(groupedByParent, (highlightedSiblings, highlightedParentNodeIndex) => {
                    const siblings = clusterNodes.filter(
                        (clusterNode) =>
                            clusterNode.parent?.nodeIndex.toString() === highlightedParentNodeIndex,
                    );
                    if (_.every(siblings, (sibling) => allHighlightedNodes.includes(sibling))) {
                        allHighlightedNodes.push(highlightedSiblings[0].parent as ClusterNode);
                        highlightedParentNodes.push(highlightedSiblings[0].parent as ClusterNode);
                    }
                });

                if (highlightedParentNodes.length > 0) {
                    getAllHighlighted(highlightedParentNodes, allHighlightedNodes);
                }
                return allHighlightedNodes;
            };

            // Get highlighted leaf cluster nodes (with gene).
            const leafHighlightedClusterNodes = clusterNodes.filter(
                (clusterNode) =>
                    clusterNode.gene != null &&
                    highlightedGenesIds.includes(clusterNode.gene.feature_id),
            );

            // Get all highlighted ancestor nodes.
            const allHighlightedNodes = getAllHighlighted(leafHighlightedClusterNodes);
            setHighlightedClusterNodesIds(
                allHighlightedNodes.map((clusterNode) => clusterNode.nodeIndex),
            );
        }
    }, [clusterNodes, highlightedGenesIds]);

    const handleDistanceMeasureChange = (event: ChangeEvent<{ value: unknown }>): void => {
        connectedDistanceMeasureChanged(event.target.value as DistanceMeasure);
    };

    const handleLinkageFunctionChange = (event: ChangeEvent<{ value: unknown }>): void => {
        connectedLinkageFunctionChanged(event.target.value as ClusteringLinkageFunction);
    };

    const getClusterNodeChildren = (parentClusterNode: ClusterNode): ClusterNode[] => {
        const childrenNodes = clusterNodes.filter(
            (clusterNode) => clusterNode.parent === parentClusterNode,
        );

        return [
            ...childrenNodes,
            ...childrenNodes.flatMap((childNode) => getClusterNodeChildren(childNode)),
        ];
    };

    const getClusterNodesChildren = (parentClusterNodes: ClusterNode[]): ClusterNode[] => {
        return parentClusterNodes.reduce((childNodes, clusterNode) => {
            return [...childNodes, ...getClusterNodeChildren(clusterNode)];
        }, [] as ClusterNode[]);
    };

    const handleOnHighlightedChanged = (chartHighlightedClusterNodesIds: number[]): void => {
        const chartHighlightedClusterNodes = clusterNodes.filter((clusterNode) =>
            chartHighlightedClusterNodesIds.includes(clusterNode.nodeIndex),
        );

        const highlightedClusterNodes = [
            ...chartHighlightedClusterNodes,
            ...getClusterNodesChildren(chartHighlightedClusterNodes),
        ];
        setHighlightedClusterNodesIds(
            highlightedClusterNodes.map((clusterNode) => clusterNode.nodeIndex),
        );

        connectedGenesHighlighted(
            highlightedClusterNodes
                .filter((clusterNode) => clusterNode.gene != null)
                .map((clusterNode) => clusterNode.gene?.feature_id) as string[],
        );
    };

    const getCaption = useCallback((): string => {
        const distanceNames = {
            spearman: "Spearman's rank correlation coefficient",
            pearson: "Pearson's correlation coefficient",
            euclidean: 'Euclidean distance',
        };
        const distance = distanceNames[distanceMeasure];
        const linkage = linkageFunction;

        const genes = advancedJoin(_.map(selectedGenes, ({ name }) => name));

        return `
Hierarchical Clustering plotted as a dendrogram is showing clusters of samples.
Distance between samples was measured with ${distance} (distance metric) and ${linkage}-linkage clustering (linkage criterion).

Clustering was done on ${selectedGenes.length === 0 ? 'all genes' : `selected genes (${genes})`}.
    `.trim();
    }, [distanceMeasure, linkageFunction, selectedGenes]);

    useReport(
        async (processFile) => {
            if (clusterNodes.length === 0) {
                return;
            }
            if (mergedData != null) {
                processFile(
                    'Sample Hierarchical Clustering/clustering_table/linkage.tsv',
                    objectsArrayToTsv(mergedData.linkage),
                    false,
                );
                processFile(
                    'Sample Hierarchical Clustering/clustering_table/order.tsv',
                    objectsArrayToTsv(mergedData.order),
                    false,
                );
            }

            if (chartRef.current != null) {
                processFile(
                    'Sample Hierarchical Clustering/image.png',
                    await chartRef.current.getPngImage(),
                    true,
                );
                processFile(
                    'Sample Hierarchical Clustering/image.svg',
                    await chartRef.current.getSvgImage(),
                    true,
                );
                processFile('Sample Hierarchical Clustering/caption.txt', getCaption(), false);
            }
        },
        [clusterNodes.length, getCaption, mergedData],
    );

    return (
        <>
            <ClusteringContainer>
                <ClusteringControls>
                    <Tooltip
                        title={
                            selectedGenes.length < 2
                                ? "The {Pearson/Spearman}  Hierarchical clustering can't be enabled until at least two genes are selected."
                                : ''
                        }
                    >
                        <ClusteringControls>
                            <ClusteringControl>
                                <DictySelect
                                    disabled={selectedGenes.length < 2}
                                    label="Distance Measure"
                                    value={distanceMeasure}
                                    handleOnChange={handleDistanceMeasureChange}
                                >
                                    {distanceMeasureOptions.map((distanceMeasureOption) => (
                                        <MenuItem
                                            value={distanceMeasureOption.value}
                                            key={distanceMeasureOption.value}
                                        >
                                            {distanceMeasureOption.label}
                                        </MenuItem>
                                    ))}
                                </DictySelect>
                            </ClusteringControl>
                            <ClusteringControl>
                                <DictySelect
                                    disabled={selectedGenes.length < 2}
                                    label="Clustering Linkage"
                                    value={linkageFunction}
                                    handleOnChange={handleLinkageFunctionChange}
                                >
                                    {linkageFunctionOptions.map((linkageFunctionOption) => (
                                        <MenuItem
                                            value={linkageFunctionOption.value}
                                            key={linkageFunctionOption.value}
                                        >
                                            {linkageFunctionOption.label}
                                        </MenuItem>
                                    ))}
                                </DictySelect>
                            </ClusteringControl>
                        </ClusteringControls>
                    </Tooltip>
                </ClusteringControls>
                {clusterNodes.length > 0 && (
                    <ClusteringChartContainer>
                        <ClusteringChart
                            clusterNodes={clusterNodes}
                            genesExpressions={genesExpressions}
                            highlightedClusterNodesIds={highlightedClusterNodesIds}
                            onHighlightedChanged={handleOnHighlightedChanged}
                            ref={chartRef}
                        />
                    </ClusteringChartContainer>
                )}
                {selectedGenes.length === 0 && `Select two or more genes.`}
                {selectedGenes.length === 1 &&
                    `The {Pearson/Spearman} correlation between samples can not be computed on a single gene.
                    Select more genes.`}
            </ClusteringContainer>
        </>
    );
};

export default connector(Clustering);
