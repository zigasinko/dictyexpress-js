import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import GeneExpressGrid from 'components/genexpress/geneExpressGrid';
import {
    customRender,
    handleCommonRequests,
    resolveStringifiedObjectPromise,
    validateExportFile,
} from 'tests/test-utils';
import {
    testState,
    generateSamplesExpressionsById,
    generateTimeSeriesById,
    generateRelationPartitions,
    generateGenesById,
} from 'tests/mock';
import { RootState } from 'redux/rootReducer';
import _ from 'lodash';
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
const selectedTimeSeries = _.flatMap(timeSeriesById)[0];
const comparisonTimeSeries = _.flatMap(timeSeriesById)[1];

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

            return handleCommonRequests(req) ?? Promise.reject(new Error(`bad url: ${req.url}`));
        });
    });

    beforeEach(() => {
        initialState = testState();
        // Set timeSeries partitions so that correct samplesExpressions can be retrieved
        // via fetchMock and gene expressions can be chosen from selected time series.
        initialState.timeSeries.byId = timeSeriesById;
        initialState.timeSeries.byId[selectedTimeSeries.id].partitions = generateRelationPartitions(
            samplesExpressionsIds,
        );
    });

    describe('time series not selected', () => {
        beforeEach(() => {
            initialState.timeSeries.selectedId = null;
            initialState.timeSeries.basketInfo = null;

            ({ container } = customRender(<GeneExpressGrid />, {
                initialState,
            }));
        });

        it('should have "Search for a gene" input disabled', () => {
            expect(screen.getByPlaceholderText('Search for a gene')).toBeDisabled();
        });

        it('should show line graph after time series and gene is pasted', async () => {
            // Simulate time series click.
            fireEvent.click(
                screen.getByText(
                    initialState.timeSeries.byId[selectedTimeSeries.id]?.collection.name,
                ),
            );

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

        it('should not export Expression Time Courses/expression_time_courses.png file', async () => {
            await validateExportFile(
                'Expression Time Courses/expression_time_courses.svg',
                (exportFile) => {
                    expect(exportFile).toBeUndefined();
                },
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

        it(`should disable color scale if more than ${colorScaleLimit} are selected`, async () => {
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
