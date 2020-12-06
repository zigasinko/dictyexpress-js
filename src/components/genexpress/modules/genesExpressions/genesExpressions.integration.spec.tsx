import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import GeneExpressGrid from 'components/genexpress/geneExpressGrid';
import { customRender, handleCommonRequests, validateExportFile } from 'tests/test-utils';
import {
    testState,
    generateSamplesExpressionsById,
    generateTimeSeriesById,
    generateRelationPartitions,
    generateGenesById,
} from 'tests/mock';
import { RootState } from 'redux/rootReducer';
import _ from 'lodash';

const genesById = generateGenesById(2);
const genes = _.flatMap(genesById);
const samplesExpressionsById = generateSamplesExpressionsById(
    5,
    genes.map((gene) => gene.feature_id),
);
const samplesExpressionsIds = _.map(_.keys(samplesExpressionsById), Number);
const timeSeriesById = generateTimeSeriesById(1);
const selectedTimeSeries = _.flatMap(timeSeriesById)[0];

describe('genesExpressions integration', () => {
    let initialState: RootState;
    let container: HTMLElement;

    // Configure fetchMock data and fixed time series data.
    beforeAll(() => {
        fetchMock.resetMocks();

        fetchMock.mockResponse((req) => {
            if (req.url.includes('add_samples')) {
                return Promise.resolve(
                    JSON.stringify({
                        id: 1,
                        permitted_organisms: ['Organism'],
                        permitted_sources: ['Source'],
                    }),
                );
            }
            if (req.url.includes('data')) {
                return Promise.resolve(
                    JSON.stringify(
                        samplesExpressionsIds.map((sampleExpressionId) => ({
                            id: sampleExpressionId,
                            output: {
                                exp_json: 123,
                            },
                            entity: {
                                id: sampleExpressionId,
                            },
                        })),
                    ),
                );
            }
            if (req.url.includes('storage')) {
                return Promise.resolve(
                    JSON.stringify({
                        json: {
                            genes: {
                                [genes[0].feature_id]: Math.random() * 10,
                                [genes[1].feature_id]: Math.random() * 10,
                            },
                        },
                    }),
                );
            }
            if (req.url.includes('autocomplete')) {
                return Promise.resolve(
                    JSON.stringify({
                        results: [genes[0], genes[1]],
                    }),
                );
            }

            if (req.url.includes('search')) {
                return Promise.resolve(JSON.stringify([genes[0]]));
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

            // Wait for points and lines to be drawn on the plot.
            await waitFor(() => {
                expect(
                    container.querySelectorAll("g[role='graphics-symbol'].genesExpressionsPoints"),
                ).toHaveLength(1);
                expect(
                    container.querySelectorAll("g[role='graphics-symbol'].genesExpressionsLines"),
                ).toHaveLength(1);
            });
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

            await waitFor(() =>
                expect(
                    container.querySelectorAll("g[role='graphics-symbol'].genesExpressionsPoints"),
                ).toHaveLength(1),
            );
        });

        it('should show second line graph after second gene is chosen in autocomplete', async () => {
            fireEvent.change(screen.getByPlaceholderText('Search for a gene'), {
                target: { value: genes[1].name.slice(0, 2) },
            });

            fireEvent.click(await screen.findByText(genes[1].name));

            await waitFor(() =>
                expect(
                    container.querySelectorAll("g[role='graphics-symbol'].genesExpressionsLines"),
                ).toHaveLength(2),
            );
        });

        it('should increase line graph stroke width after gene is highlighted', async () => {
            expect(
                container.querySelector("g[role='graphics-symbol'].genesExpressionsLines path"),
            ).toHaveAttribute('stroke-width', '2');

            fireEvent.click(screen.getByRole('button', { name: genes[0].name }));
            fireEvent.click(await screen.findByText('Highlight'));

            await waitFor(() =>
                expect(
                    container.querySelector("g[role='graphics-symbol'].genesExpressionsLines path"),
                ).toHaveAttribute('stroke-width', '4'),
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
});
