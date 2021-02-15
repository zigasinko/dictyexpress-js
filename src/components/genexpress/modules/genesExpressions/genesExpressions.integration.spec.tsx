import React from 'react';
import { screen, fireEvent, waitFor, RenderResult } from '@testing-library/react';
import GeneExpressGrid from 'components/genexpress/geneExpressGrid';
import {
    customRender,
    handleCommonRequests,
    resolveStringifiedObjectPromise,
    validateCreateStateRequest,
    validateExportFile,
} from 'tests/test-utils';
import {
    testState,
    generateSamplesExpressionsById,
    generateTimeSeriesById,
    generateRelationPartitions,
    generateGenesById,
    generateBackendBookmark,
    generateBookmarkQueryParameter,
    generateGenesQueryParameter,
} from 'tests/mock';
import { RootState } from 'redux/rootReducer';
import _ from 'lodash';
import { BookmarkStatePath } from 'components/genexpress/common/constants';
import {
    colorScaleLimit,
    highlightedLineStrokeWidth,
    lineStrokeWidth,
} from './genesExpressionsLineChart';

const genesById = generateGenesById(colorScaleLimit);
const genes = _.flatMap(genesById);
const samplesExpressionsById = generateSamplesExpressionsById(
    5,
    genes.map((gene) => gene.feature_id),
);
const samplesExpressionsIds = _.map(_.keys(samplesExpressionsById), Number);
const comparisonsSamplesExpressionsById = generateSamplesExpressionsById(
    5,
    genes.map((gene) => gene.feature_id),
);
const comparisonsSamplesExpressionsIds = _.map(_.keys(comparisonsSamplesExpressionsById), Number);
const timeSeriesById = generateTimeSeriesById(2);
const timeSeries = _.flatMap(timeSeriesById);
const selectedTimeSeries = timeSeries[0];
const comparisonTimeSeries = timeSeries[1];

const backendBookmark = generateBackendBookmark(selectedTimeSeries.id, [
    genes[0].feature_id,
    genes[1].feature_id,
]);
_.set(backendBookmark.state, BookmarkStatePath.genesExpressionsShowLegend, true);

describe('genesExpressions integration', () => {
    let initialState: RootState;
    let container: HTMLElement;

    const validateChart = async (numberOfGenes: number): Promise<void> =>
        waitFor(() => {
            expect(
                container.querySelectorAll("g[role='graphics-symbol'].genesExpressionsPoints"),
            ).toHaveLength(numberOfGenes);
            expect(
                container.querySelectorAll("g[role='graphics-symbol'].genesExpressionsLines"),
            ).toHaveLength(numberOfGenes);
        });

    // Configure fetchMock data and fixed time series data.
    beforeAll(() => {
        fetchMock.resetMocks();

        fetchMock.mockResponse((req) => {
            if (req.url.includes('relation')) {
                return resolveStringifiedObjectPromise(timeSeries);
            }
            if (req.url.includes('add_samples')) {
                return resolveStringifiedObjectPromise({
                    id: 1,
                    permitted_organisms: ['Organism'],
                    permitted_sources: ['Source'],
                });
            }
            if (req.url.includes('data')) {
                return resolveStringifiedObjectPromise(
                    [...samplesExpressionsIds, ...comparisonsSamplesExpressionsIds].map(
                        (sampleExpressionId) => ({
                            id: sampleExpressionId,
                            output: {
                                exp_json: 123,
                            },
                            entity: {
                                id: sampleExpressionId,
                            },
                        }),
                    ),
                );
            }
            if (req.url.includes('storage')) {
                return resolveStringifiedObjectPromise({
                    json: {
                        genes: {
                            [genes[0].feature_id]: Math.random() * 10,
                            [genes[1].feature_id]: Math.random() * 10,
                        },
                    },
                });
            }
            if (req.url.includes('autocomplete')) {
                return resolveStringifiedObjectPromise({
                    results: genes,
                });
            }
            if (req.url.includes('search')) {
                return resolveStringifiedObjectPromise([genes[0]]);
            }
            if (req.url.includes('list_by_ids')) {
                return resolveStringifiedObjectPromise(
                    backendBookmark.state.genes.selectedGenesIds.map((geneId) => genesById[geneId]),
                );
            }
            if (req.url.includes('app-state')) {
                return resolveStringifiedObjectPromise(backendBookmark);
            }

            return handleCommonRequests(req) ?? Promise.reject(new Error(`bad url: ${req.url}`));
        });
    });

    beforeEach(() => {
        fetchMock.mockClear();

        initialState = testState();
        // Set timeSeries partitions so that correct samplesExpressions can be retrieved
        // via fetchMock and gene expressions can be chosen from selected time series.
        initialState.timeSeries.byId = timeSeriesById;
        selectedTimeSeries.partitions = generateRelationPartitions(samplesExpressionsIds);
    });

    describe('time series not in store, genes in query parameter', () => {
        beforeEach(() => {
            initialState.timeSeries.byId = {};
            initialState.timeSeries.basketInfo = null;

            ({ container } = customRender(<GeneExpressGrid />, {
                initialState,
                route: generateGenesQueryParameter(backendBookmark.state.genes.selectedGenesIds),
            }));
        });

        it('should select first time series and genes from url query parameter "genes"', async () => {
            await validateChart(backendBookmark.state.genes.selectedGenesIds.length);
            backendBookmark.state.genes.selectedGenesIds.forEach((geneId) => {
                expect(screen.getAllByText(genesById[geneId].name)).toHaveLength(1);
            });
        });
    });

    describe('time series not selected', () => {
        let unmount: RenderResult['unmount'];

        beforeEach(() => {
            initialState.timeSeries.selectedId = null;
            initialState.timeSeries.basketInfo = null;

            ({ container, unmount } = customRender(<GeneExpressGrid />, {
                initialState,
            }));
        });

        it('should have "Search for a gene" input disabled', () => {
            expect(screen.getByPlaceholderText('Search for a gene')).toBeDisabled();
        });

        it('should show line graph after time series is chosen and gene is pasted', async () => {
            // Simulate time series click.
            fireEvent.click(screen.getByText(selectedTimeSeries.collection.name));

            // Wait for "Search for a gene" input to get enabled.
            await waitFor(() =>
                expect(screen.getByPlaceholderText('Search for a gene')).toBeEnabled(),
            );

            // Enter a gene and check if it's displayed in graph.
            fireEvent.paste(screen.getByPlaceholderText('Search for a gene'), {
                clipboardData: { getData: jest.fn().mockReturnValueOnce(genes[0].name) },
            });

            await validateChart(1);
        });

        it('should not export Expression Time Courses/expression_time_courses.png file', async () => {
            await validateExportFile(
                'Expression Time Courses/expression_time_courses.png',
                (exportFile) => {
                    expect(exportFile).toBeUndefined();
                },
            );
        });

        it('should not export Expression Time Courses/expression_time_courses.svg file', async () => {
            await validateExportFile(
                'Expression Time Courses/expression_time_courses.svg',
                (exportFile) => {
                    expect(exportFile).toBeUndefined();
                },
            );
        });

        it('should load selected time series, genes and genesExpressions controls values from bookmark', async () => {
            unmount();

            ({ container } = customRender(<GeneExpressGrid />, {
                initialState,
                route: generateBookmarkQueryParameter(),
            }));

            await validateChart(backendBookmark.state.genes.selectedGenesIds.length);

            await waitFor(() =>
                expect(
                    container.querySelector('g[role="graphics-object"] g.legendLabel text'),
                ).toBeInTheDocument(),
            );
        });
    });

    describe('time series and one gene selected', () => {
        beforeEach(async () => {
            initialState.timeSeries.selectedId = selectedTimeSeries.id;
            initialState.genes.byId = genesById;
            initialState.genes.selectedGenesIds = [genes[0].feature_id];
            initialState.samplesExpressions.byId = samplesExpressionsById;

            ({ container } = customRender(<GeneExpressGrid />, {
                initialState,
            }));

            await validateChart(initialState.genes.selectedGenesIds.length);
        });

        it('should show second line graph after second gene is chosen in autocomplete', async () => {
            fireEvent.change(screen.getByPlaceholderText('Search for a gene'), {
                target: { value: genes[1].name.slice(0, 2) },
            });

            fireEvent.click(await screen.findByText(genes[1].name));

            await validateChart(2);
        });

        it('should increase line graph stroke width after gene is highlighted', async () => {
            expect(
                container.querySelector("g[role='graphics-symbol'].genesExpressionsLines path"),
            ).toHaveAttribute('stroke-width', lineStrokeWidth.toString());

            fireEvent.click(screen.getByRole('button', { name: genes[0].name }));
            fireEvent.click(await screen.findByText('Highlight'));

            await waitFor(() =>
                expect(
                    container.querySelector("g[role='graphics-symbol'].genesExpressionsLines path"),
                ).toHaveAttribute('stroke-width', highlightedLineStrokeWidth.toString()),
            );
        });

        it('should display tooltip on point hover', async () => {
            fireEvent.mouseMove(
                container.querySelector(
                    "g[role='graphics-symbol'].genesExpressionsPoints > path",
                ) as Element,
            );

            await screen.findByText('Gene:');
        });

        it('should display the legend after user clicks on "Legend" button', async () => {
            // Should be hidden by default.
            expect(
                container.querySelector('g[role="graphics-object"] g.legendLabel text'),
            ).not.toBeInTheDocument();

            fireEvent.click(screen.getByText('Legend'));

            await waitFor(() =>
                expect(
                    container.querySelector('g[role="graphics-object"] g.legendLabel text'),
                ).toBeInTheDocument(),
            );
        });

        it('should export visualization Expression Time Courses/expression_time_courses.png file', async () => {
            await validateExportFile(
                'Expression Time Courses/expression_time_courses.png',
                (exportFile) => {
                    expect(exportFile).toBeDefined();
                },
            );
        });

        it('should export visualization Expression Time Courses/expression_time_courses.svg file', async () => {
            await validateExportFile(
                'Expression Time Courses/expression_time_courses.svg',
                (exportFile) => {
                    expect(exportFile).toBeDefined();
                },
            );
        });

        it('should save selected time series, genes, highlighted genes and all component bookmarkable state to app-state api', async () => {
            fireEvent.click(screen.getByLabelText('Bookmark'));

            await validateCreateStateRequest((bookmarkState) => {
                expect(bookmarkState.timeSeries.selectedId).toEqual(
                    initialState.timeSeries.selectedId,
                );
                expect(bookmarkState.genes.selectedGenesIds).toEqual(
                    initialState.genes.selectedGenesIds,
                );
                expect(bookmarkState.genes.highlightedGenesIds).toEqual(
                    initialState.genes.highlightedGenesIds,
                );
                expect(_.get(bookmarkState, BookmarkStatePath.genesExpressionsShowLegend)).toEqual(
                    false,
                );
            });
        });
    });

    describe(`time series, comparison time series and ${colorScaleLimit - 1} gene selected`, () => {
        const getLinesColors = (): (string | undefined)[] => {
            const linesElements = Array.from(
                container.querySelectorAll("g[role='graphics-symbol'].genesExpressionsLines path"),
            );

            return linesElements.map((line) => line.attributes.getNamedItem('stroke')?.value);
        };

        beforeEach(async () => {
            initialState.timeSeries.selectedId = selectedTimeSeries.id;
            initialState.genes.byId = genesById;
            initialState.genes.selectedGenesIds = genes.slice(0, -1).map((gene) => gene.feature_id);
            initialState.samplesExpressions.byId = {
                ...samplesExpressionsById,
                ...comparisonsSamplesExpressionsById,
            };
            initialState.timeSeries.comparisonIds = [comparisonTimeSeries.id];

            initialState.timeSeries.byId[
                comparisonTimeSeries.id
            ].partitions = generateRelationPartitions(comparisonsSamplesExpressionsIds);

            ({ container } = customRender(<GeneExpressGrid />, {
                initialState,
            }));

            await validateChart(initialState.genes.selectedGenesIds.length * 2);

            // Each gene has it's own color by default.
            const linesColors = getLinesColors();

            expect(_.uniq(linesColors).length).toBe(initialState.genes.selectedGenesIds.length);
        });

        it(`should disable color scale if more than "colorScaleLimit" are selected`, async () => {
            fireEvent.change(screen.getByPlaceholderText('Search for a gene'), {
                target: { value: genes[genes.length - 1].name },
            });

            fireEvent.click(await screen.findByText(genes[genes.length - 1].name));

            await waitFor(() => {
                const newLinesColors = getLinesColors();
                expect(_.uniq(newLinesColors).length).toBe(1);
            });
        });

        it('should switch to color by time series when user clicks on the switch', async () => {
            fireEvent.click(screen.getByText('Color by time series'));

            await waitFor(() => {
                const linesColors = getLinesColors();
                expect(_.uniq(linesColors).length).toBe(2);
            });
        });
    });
});
