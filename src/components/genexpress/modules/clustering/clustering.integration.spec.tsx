/* eslint-disable no-await-in-loop */
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import GeneExpressGrid from 'components/genexpress/geneExpressGrid';
import {
    customRender,
    getFetchMockCallsWithUrl,
    handleCommonRequests,
    resolveStringifiedObjectPromise,
} from 'tests/test-utils';
import {
    testState,
    generateData,
    generateHierarchicalClusteringJson,
    generateSamplesExpressionsById,
    generateTimeSeriesById,
    generateRelationPartitions,
    generateGenesByIdPredefinedIds,
    generateBasketExpression,
} from 'tests/mock';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import { RootState } from 'redux/rootReducer';
import { DONE_DATA_STATUS, WAITING_DATA_STATUS } from '@genialis/resolwe/dist/api/types/rest';
import { mergeClusteringData } from 'redux/epics/clusteringEpics';
import { generateRandomString } from 'utils/stringUtils';
import { Server } from 'mock-socket';
import { sessionId, webSocketUrl } from 'api/base';
import { distanceMeasureOptions, linkageFunctionOptions } from './clustering';
import { highlightedColor } from './clusteringChart';

const timeSeriesById = generateTimeSeriesById(1);
const selectedTimeSeriesId = parseInt(_.keys(timeSeriesById)[0], 10);

const basketExpressions = [generateBasketExpression(), generateBasketExpression()];

const clusteringJson = generateHierarchicalClusteringJson();
const genesById = generateGenesByIdPredefinedIds(
    _.map(clusteringJson.gene_symbols, (geneSymbol) => geneSymbol.gene),
);
const differentGenesById = generateGenesByIdPredefinedIds(
    _.map(clusteringJson.gene_symbols, (geneSymbol) => geneSymbol.gene),
);
// Change genes names so that assertions can be made for a different gene pool.
_.forEach(differentGenesById, (gene) => {
    // eslint-disable-next-line no-param-reassign
    gene.name += generateRandomString(5);
});
const genes = _.flatMap(genesById);
const differentGenes = _.flatMap(differentGenesById);

const samplesExpressionsById = generateSamplesExpressionsById(
    5,
    genes.map((gene) => gene.feature_id),
);
const samplesExpressionsIds = _.map(_.keys(samplesExpressionsById), Number);
timeSeriesById[selectedTimeSeriesId].partitions = generateRelationPartitions(samplesExpressionsIds);

const dataId = 123;
const storageId = 456;

describe('clustering integration', () => {
    let initialState: RootState;
    let container: HTMLElement;

    beforeEach(() => {
        /* InitialState must have all the data needed for gene expressions (used in
         * clustering heatmap). Fetching / loading geneExpressions data is tested in
         * genesExpressions module.
         */
        initialState = testState();
        initialState.timeSeries.byId = timeSeriesById;
        initialState.timeSeries.selectedId = selectedTimeSeriesId;
        initialState.samplesExpressions.byId = samplesExpressionsById;
    });

    describe('process data exists', () => {
        beforeAll(() => {
            fetchMock.resetMocks();

            fetchMock.mockResponse((req) => {
                if (req.url.includes('get_or_create')) {
                    return resolveStringifiedObjectPromise({
                        id: dataId,
                    });
                }

                if (req.url.includes('data') && req.url.includes(dataId.toString())) {
                    return resolveStringifiedObjectPromise({
                        items: [
                            {
                                ...generateData(1),
                                ...{
                                    status: DONE_DATA_STATUS,
                                    output: {
                                        cluster: storageId,
                                    },
                                },
                            },
                        ],
                    });
                }

                if (
                    req.url.includes('data') &&
                    decodeURIComponent(req.url).includes('data:expression')
                ) {
                    return resolveStringifiedObjectPromise(
                        samplesExpressionsIds.map((sampleExpressionId) => ({
                            id: sampleExpressionId,
                            output: {
                                exp_json: 123,
                            },
                            entity: {
                                id: sampleExpressionId,
                            },
                        })),
                    );
                }

                if (req.url.includes('add_samples')) {
                    return resolveStringifiedObjectPromise({
                        id: 1,
                        permitted_organisms: ['Organism'],
                        permitted_sources: ['Source'],
                    });
                }

                if (req.url.includes('basket_expressions')) {
                    return resolveStringifiedObjectPromise(basketExpressions);
                }

                if (req.url.includes('storage') && req.url.includes(storageId.toString())) {
                    return resolveStringifiedObjectPromise({
                        json: clusteringJson,
                    });
                }

                if (req.url.includes('storage')) {
                    return resolveStringifiedObjectPromise({
                        json: {
                            genes: genes.reduce(
                                (byId, gene) => ({
                                    ...byId,
                                    [gene.feature_id]: Math.random() * 10,
                                }),
                                {},
                            ),
                        },
                    });
                }

                if (req.url.includes('autocomplete')) {
                    return resolveStringifiedObjectPromise({
                        results: [genes[0], genes[1]],
                    });
                }

                return (
                    handleCommonRequests(req) ?? Promise.reject(new Error(`bad url: ${req.url}`))
                );
            });
        });

        describe('clustering data not in store, genes not selected', () => {
            beforeEach(() => {
                initialState.timeSeries.selectedId = null;
                initialState.clustering.mergedData = null;
                initialState.genes.byId = genesById;
                initialState.genes.selectedGenesIds = [];

                ({ container } = customRender(<GeneExpressGrid />, {
                    initialState,
                }));
            });

            it('input controls should be disabled', () => {
                expect(screen.getByLabelText('Distance Measure')).toHaveClass('Mui-disabled');
                expect(screen.getByLabelText('Clustering Linkage')).toHaveClass('Mui-disabled');
            });

            it('should show a warning that no genes are selected', () => {
                screen.findByText('Select two or more genes.');
            });

            it('should show a warning that only one gene is selected (after it is selected)', async () => {
                fireEvent.change(screen.getByPlaceholderText('Search for a gene'), {
                    target: { value: genes[0].name.slice(0, 2) },
                });

                fireEvent.click(await screen.findByText(genes[0].name));
                await screen.findByText(
                    'correlation between samples can not be computed on a single gene.',
                    { exact: false },
                );
            });

            it('should show hierarchical clustering plot after timeSeries and two genes are chosen', async () => {
                // Simulate time series click.
                fireEvent.click(
                    screen.getByText(
                        initialState.timeSeries.byId[selectedTimeSeriesId]?.collection.name,
                    ),
                );

                // Wait for "Search for a gene" input to get enabled.
                await waitFor(() =>
                    expect(screen.getByPlaceholderText('Search for a gene')).toBeEnabled(),
                );

                fireEvent.change(screen.getByPlaceholderText('Search for a gene'), {
                    target: { value: genes[0].name.slice(0, 2) },
                });

                fireEvent.click(await screen.findByText(genes[0].name));

                fireEvent.change(screen.getByPlaceholderText('Search for a gene'), {
                    target: { value: genes[1].name.slice(0, 3) },
                });

                fireEvent.click(await screen.findByText(genes[1].name));

                // Wait for lines, heatmap and names to be drawn on the plot.
                await waitFor(() => {
                    expect(
                        container.querySelector("g[role='graphics-symbol'].horizontalLines > path"),
                    ).toBeInTheDocument();
                    expect(
                        container.querySelector("g[role='graphics-symbol'].verticalLines > path"),
                    ).toBeInTheDocument();
                    expect(
                        container.querySelector("g[role='graphics-object'].genesNames > text"),
                    ).toBeInTheDocument();
                    expect(
                        container.querySelector(
                            "g[role='graphics-symbol'].genesExpressionsHeatmap > path",
                        ),
                    ).toBeInTheDocument();
                    screen.getByText(genes[3].name);
                });
            });
        });

        describe('clustering data already in store, two genes selected', () => {
            beforeEach(async () => {
                initialState.timeSeries.basketExpressionsIds = basketExpressions.map(
                    (basketExpression) => basketExpression.id,
                );
                initialState.genes.byId = differentGenesById;
                initialState.genes.selectedGenesIds = [genes[0].feature_id, genes[1].feature_id];
                initialState.clustering.mergedData = mergeClusteringData(clusteringJson, genesById);
                initialState.clustering.distanceMeasure = distanceMeasureOptions[0].value;
                initialState.clustering.linkageFunction = linkageFunctionOptions[0].value;

                ({ container } = customRender(<GeneExpressGrid />, {
                    initialState,
                }));

                await waitFor(() => {
                    expect(
                        container.querySelector(
                            "g[role='graphics-symbol'].genesExpressionsHeatmap",
                        ),
                    ).toBeInTheDocument();
                });
            });

            it('should show different hierarchical clustering after user changes distance measure', async () => {
                // Click on dropdown. MouseDown event has to be used, because material-ui Select component
                // listens to mouseDown event to expand options menu.
                fireEvent.mouseDown(screen.getByLabelText('Distance Measure'));
                fireEvent.click(await screen.findByText(distanceMeasureOptions[1].label));

                await screen.findByText(differentGenes[3].name);
            });

            it('should show different hierarchical clustering after user changes linkage function', async () => {
                // Click on dropdown. MouseDown event has to be used, because material-ui Select component
                // listens to mouseDown event to expand options menu.
                fireEvent.mouseDown(screen.getByLabelText('Clustering Linkage'));
                fireEvent.click(await screen.findByText(linkageFunctionOptions[1].label));

                await screen.findByText(differentGenes[3].name);
            });

            it('should display tooltip on gene expressions heatmap hover', async () => {
                fireEvent.mouseMove(
                    container.querySelector(
                        "g[role='graphics-symbol'].genesExpressionsHeatmap > path",
                    ) as Element,
                );

                await screen.findByText('Time:');
                await screen.findByText('Level:');
            });

            it('should change line color on gene expressions heatmap hover', async () => {
                // When no genes are highlighted, all lines should have default color.
                expect(
                    container.querySelector(
                        `g[role='graphics-symbol'].horizontalLines > path[fill='${highlightedColor}']`,
                    ),
                ).not.toBeInTheDocument();
                expect(
                    container.querySelector(
                        `g[role='graphics-symbol'].verticalLines > path[fill='${highlightedColor}']`,
                    ),
                ).not.toBeInTheDocument();

                fireEvent.mouseOver(
                    container.querySelector(
                        "g[role='graphics-symbol'].genesExpressionsHeatmap > path",
                    ) as Element,
                );

                // On mouseOver at least one highlighted line should be in the document.
                await waitFor(() => {
                    expect(
                        container.querySelector(
                            `g[role='graphics-symbol'].horizontalLines > path[fill='${highlightedColor}']`,
                        ),
                    ).toBeInTheDocument();
                    expect(
                        container.querySelector(
                            `g[role='graphics-symbol'].verticalLines > path[fill='${highlightedColor}']`,
                        ),
                    ).toBeInTheDocument();
                });
            });

            it('should change line color on horizontalLines hover', async () => {
                // When no genes are highlighted, all lines should have default color.
                expect(
                    container.querySelector(
                        `g[role='graphics-symbol'].horizontalLines > path[fill='${highlightedColor}']`,
                    ),
                ).not.toBeInTheDocument();
                expect(
                    container.querySelector(
                        `g[role='graphics-symbol'].verticalLines > path[fill='${highlightedColor}']`,
                    ),
                ).not.toBeInTheDocument();

                fireEvent.mouseOver(
                    container.querySelector(
                        "g[role='graphics-symbol'].horizontalLines > path",
                    ) as Element,
                );

                // On mouseOver at least one highlighted line should be in the document.
                await waitFor(() => {
                    expect(
                        container.querySelector(
                            `g[role='graphics-symbol'].horizontalLines > path[fill='${highlightedColor}']`,
                        ),
                    ).toBeInTheDocument();
                    expect(
                        container.querySelector(
                            `g[role='graphics-symbol'].verticalLines > path[fill='${highlightedColor}']`,
                        ),
                    ).toBeInTheDocument();
                });
            });

            it('should change line color on verticalLines hover', async () => {
                // When no genes are highlighted, all lines should have default color.
                expect(
                    container.querySelector(
                        `g[role='graphics-symbol'].horizontalLines > path[fill='${highlightedColor}']`,
                    ),
                ).not.toBeInTheDocument();
                expect(
                    container.querySelector(
                        `g[role='graphics-symbol'].verticalLines > path[fill='${highlightedColor}']`,
                    ),
                ).not.toBeInTheDocument();

                fireEvent.mouseOver(
                    container.querySelector(
                        "g[role='graphics-symbol'].verticalLines > path",
                    ) as Element,
                );

                // On mouseOver at least one highlighted line should be in the document.
                await waitFor(() => {
                    expect(
                        container.querySelector(
                            `g[role='graphics-symbol'].horizontalLines > path[fill='${highlightedColor}']`,
                        ),
                    ).toBeInTheDocument();
                    expect(
                        container.querySelector(
                            `g[role='graphics-symbol'].verticalLines > path[fill='${highlightedColor}']`,
                        ),
                    ).toBeInTheDocument();
                });
            });

            it('should change line color after gene is highlighted', async () => {
                // When no genes are highlighted, all lines should have default color.
                expect(
                    container.querySelector(
                        `g[role='graphics-symbol'].horizontalLines > path[fill='${highlightedColor}']`,
                    ),
                ).not.toBeInTheDocument();

                fireEvent.click(screen.getByRole('button', { name: differentGenes[0].name }));
                fireEvent.click(await screen.findByText('Highlight'));

                await waitFor(() =>
                    expect(
                        container.querySelector(
                            `g[role='graphics-symbol'].horizontalLines > path[fill='${highlightedColor}']`,
                        ),
                    ).toBeInTheDocument(),
                );
            });

            it('should highlight a gene when user clicks on a line', async () => {
                // When no genes are highlighted, all lines should have default color.
                expect(
                    container.querySelector(
                        `g[role='graphics-symbol'].horizontalLines > path[fill='${highlightedColor}']`,
                    ),
                ).not.toBeInTheDocument();

                fireEvent.click(
                    container.querySelector(
                        "g[role='graphics-symbol'].genesExpressionsHeatmap > path",
                    ) as Element,
                );

                await waitFor(() =>
                    expect(
                        container.querySelector(
                            `g[role='graphics-symbol'].horizontalLines > path[fill='${highlightedColor}']`,
                        ),
                    ).toBeInTheDocument(),
                );
            });
        });
    });

    describe("process data doesn't exist", () => {
        const observerId = uuidv4();
        let webSocketMock: WebSocket;

        beforeAll(() => {
            fetchMock.resetMocks();

            fetchMock.mockResponse(async (req) => {
                if (
                    req.url.includes('get_or_create') &&
                    (await req.json()).process.slug === ProcessSlug.clustering
                ) {
                    return resolveStringifiedObjectPromise({
                        id: dataId,
                    });
                }

                if (req.url.includes('data') && req.url.includes(dataId.toString())) {
                    return resolveStringifiedObjectPromise({
                        items: [
                            {
                                ...generateData(1),
                                ...{
                                    status: WAITING_DATA_STATUS,
                                    output: {},
                                },
                            },
                        ],
                        observer: observerId,
                    });
                }

                if (req.url.includes('basket_expressions')) {
                    return resolveStringifiedObjectPromise(basketExpressions);
                }

                if (req.url.includes('storage')) {
                    return resolveStringifiedObjectPromise({
                        json: clusteringJson,
                    });
                }

                if (req.url.includes('autocomplete')) {
                    return resolveStringifiedObjectPromise({
                        results: [genes[0], genes[1]],
                    });
                }

                return (
                    handleCommonRequests(req) ?? Promise.reject(new Error(`bad url: ${req.url}`))
                );
            });
        });

        beforeEach(() => {
            const mockServer = new Server(webSocketUrl + sessionId);
            mockServer.on('connection', (socket) => {
                webSocketMock = socket;
            });

            initialState.genes.byId = genesById;
            initialState.timeSeries.basketExpressionsIds = basketExpressions.map(
                (basketExpression) => basketExpression.id,
            );

            ({ container } = customRender(<GeneExpressGrid />, {
                initialState,
            }));
        });

        it('should display hierarchical clustering plot, with data fetched via websocket, after two genes are chosen', async () => {
            fireEvent.change(screen.getByPlaceholderText('Search for a gene'), {
                target: { value: genes[0].name.slice(0, 2) },
            });

            fireEvent.click(await screen.findByText(genes[0].name));

            fireEvent.change(screen.getByPlaceholderText('Search for a gene'), {
                target: { value: genes[1].name.slice(0, 3) },
            });

            fireEvent.click(await screen.findByText(genes[1].name));

            // Wait for data object with 'waiting' status is returned.
            await waitFor(() => {
                expect(getFetchMockCallsWithUrl(`api/data?id=${dataId}`)).toHaveLength(1);
            });

            await waitFor(() => {
                webSocketMock.send(
                    JSON.stringify({
                        item: {
                            ...generateData(1),
                            ...{
                                status: DONE_DATA_STATUS,
                                output: {
                                    cluster: 1,
                                    species: genes[0].species,
                                    source: genes[0].source,
                                },
                            },
                        },
                        msg: 'changed',
                        observer: observerId,
                        primary_key: 'id',
                    }),
                );
            });

            // Mocked WebSocket needs almost a second to establish connection, that's why
            // increased timeout is used.
            await waitFor(
                () => {
                    expect(
                        container.querySelector("g[role='graphics-symbol'].horizontalLines > path"),
                    ).toBeInTheDocument();
                    expect(
                        container.querySelector("g[role='graphics-symbol'].verticalLines > path"),
                    ).toBeInTheDocument();
                    expect(
                        container.querySelector("g[role='graphics-object'].genesNames > text"),
                    ).toBeInTheDocument();
                    expect(
                        container.querySelector(
                            "g[role='graphics-symbol'].genesExpressionsHeatmap > path",
                        ),
                    ).toBeInTheDocument();
                    screen.getByText(genes[3].name);
                },
                { timeout: 3500 },
            );
        });
    });
});
