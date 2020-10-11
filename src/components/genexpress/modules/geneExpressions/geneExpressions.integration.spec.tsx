import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import GeneExpressGrid from 'components/genexpress/geneExpressGrid';
import { customRender } from 'tests/test-utils';
import {
    testState,
    generateGene,
    generateSamplesExpressionsById,
    generatePartition,
    generateTimeSeriesById,
} from 'tests/mock';
import { RootState } from 'redux/rootReducer';
import _ from 'lodash';

const genes = [generateGene(1), generateGene(2)];
const samplesExpressionsById = generateSamplesExpressionsById(5);
const samplesExpressionsIds = Object.keys(samplesExpressionsById);
const timeSeriesById = generateTimeSeriesById(1);
const timeSeries = _.flatMap(timeSeriesById)[0];

describe('geneExpressions integration', () => {
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
                return Promise.resolve(
                    JSON.stringify([{ name: genes[0].name, feature_id: genes[0].feature_id }]),
                );
            }

            if (req.url.includes('csrf')) {
                return Promise.resolve('');
            }

            return Promise.reject(new Error(`bad url: ${req.url}`));
        });
    });

    beforeEach(() => {
        initialState = testState();
        // Set timeSeries partitions so that correct samplesExpressions can be retrieved
        // via fetchMock.
        initialState.timeSeries.byId = timeSeriesById;
        initialState.timeSeries.byId[timeSeries.id].partitions = _.times(5, (i) =>
            generatePartition(i, parseInt(samplesExpressionsIds[i], 10)),
        );
        initialState.samplesExpressions.byId = samplesExpressionsById;
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
                screen.getByText(initialState.timeSeries.byId[timeSeries.id]?.collection.name),
            );

            // Wait for "Search for a gene" input to get enabled.
            await waitFor(() =>
                expect(screen.getByPlaceholderText('Search for a gene')).toBeEnabled(),
            );

            // Enter a gene and check if it's displayed in graph.
            fireEvent.paste(screen.getByPlaceholderText('Search for a gene'), {
                clipboardData: { getData: jest.fn().mockReturnValueOnce(genes[0].name) },
            });

            // Wait for points to be drawn on the plot.
            await waitFor(() =>
                expect(
                    container.querySelectorAll("g[role='graphics-symbol'].geneExpressionsPoints"),
                ).toHaveLength(1),
            );
            // Lines should also be be drawn on the plot.
            expect(
                container.querySelectorAll("g[role='graphics-symbol'].genesExpressionsLines"),
            ).toHaveLength(1);
        });
    });

    describe('time series and one gene selected', () => {
        beforeEach(async () => {
            initialState.timeSeries.selectedId = timeSeries.id;
            initialState.selectedGenes.byId = { [genes[0].feature_id]: genes[0] };

            ({ container } = customRender(<GeneExpressGrid />, {
                initialState,
            }));

            await waitFor(() =>
                expect(
                    container.querySelectorAll("g[role='graphics-symbol'].geneExpressionsPoints"),
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
                    container.querySelectorAll("g[role='graphics-symbol'].geneExpressionsPoints"),
                ).toHaveLength(1),
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

        it('should display tooltip and stroke the line on point hover', async () => {
            fireEvent.mouseMove(
                container.querySelector(
                    "g[role='graphics-symbol'].geneExpressionsPoints path",
                ) as Element,
            );

            await screen.findByText('Gene name:');
        });
    });
});
