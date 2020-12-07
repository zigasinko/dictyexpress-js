import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import GeneExpressGrid from 'components/genexpress/geneExpressGrid';
import { customRender } from 'tests/test-utils';
import {
    testState,
    generateDifferentialExpressionsById,
    generateDifferentialExpressionJson,
    generateGenesByIdPredefinedIds,
} from 'tests/mock';
import _ from 'lodash';
import { RootState } from 'redux/rootReducer';

const differentialExpressionsById = generateDifferentialExpressionsById(2);
const differentialExpressions = _.flatMap(differentialExpressionsById);
const numberOfGenes = 5;
const differentialExpressionJson = generateDifferentialExpressionJson(numberOfGenes);

describe('differentialExpressions integration', () => {
    let initialState: RootState;
    let container: HTMLElement;

    beforeAll(() => {
        fetchMock.resetMocks();

        fetchMock.mockResponse((req) => {
            if (req.url.includes('storage')) {
                return Promise.resolve(
                    JSON.stringify({
                        id: differentialExpressions[0].output.de_json,
                        json: generateDifferentialExpressionJson(numberOfGenes),
                    }),
                );
            }

            if (req.url.includes('csrf')) {
                return Promise.resolve('');
            }

            if (req.url.includes('user?current_only')) {
                return Promise.resolve(JSON.stringify({ items: [] }));
            }

            return Promise.reject(new Error(`bad url: ${req.url}`));
        });
    });

    describe('differentialExpression not selected', () => {
        beforeEach(() => {
            initialState = testState();
            initialState.differentialExpressions.byId = differentialExpressionsById;

            ({ container } = customRender(<GeneExpressGrid />, {
                initialState,
            }));
        });

        it('should show volcano plot after differential expression is chosen', async () => {
            // Click on dropdown. MouseDown event has to be used, because material-ui Select component
            // listens to mouseDown event to expand options menu.
            fireEvent.mouseDown(await screen.findByLabelText('Differential expression'));

            // Click on dropdown item (first differential expression).
            fireEvent.click(await screen.findByText(differentialExpressions[0].name));

            await waitFor(() => {
                // Volcano Points.
                expect(
                    container.querySelectorAll(
                        "g[role='graphics-symbol'].volcanoPointRemaining > path",
                    ),
                ).toHaveLength(numberOfGenes);

                // X thresholds.
                expect(
                    container.querySelectorAll("g[role='graphics-symbol'].xThresholdsRect"),
                ).toHaveLength(1);

                // Y thresholds.
                expect(
                    container.querySelectorAll("g[role='graphics-symbol'].yThresholdsRect"),
                ).toHaveLength(1);
            });
        });
    });

    describe('differentialExpression selected, one gene selected and one gene highlighted', () => {
        beforeEach(async () => {
            initialState = testState();

            initialState.differentialExpressions.byId = differentialExpressionsById;
            initialState.differentialExpressions.byId[
                differentialExpressions[0].id
            ].json = differentialExpressionJson;

            initialState.differentialExpressions.selectedId = differentialExpressions[0].id;
            initialState.genes.byId = generateGenesByIdPredefinedIds(
                differentialExpressionJson.gene_id,
            );
            initialState.genes.selectedGenesIds = [differentialExpressionJson.gene_id[0]];
            initialState.genes.highlightedGenesIds = [differentialExpressionJson.gene_id[1]];

            ({ container } = customRender(<GeneExpressGrid />, {
                initialState,
            }));

            // Wait until vega plot is drawn.
            await waitFor(() => {
                expect(
                    container.querySelectorAll(
                        "g[role='graphics-symbol'].volcanoPointRemaining > path",
                    ),
                ).toHaveLength(numberOfGenes);
            });
        });

        it('should display tooltip on point hover', async () => {
            fireEvent.mouseMove(
                container.querySelector(
                    "g[role='graphics-symbol'].volcanoPointRemaining > path",
                ) as Element,
            );

            await waitFor(() => {
                expect(screen.getByText('Gene:')).toBeInTheDocument();
            });
        });

        it('should display selected genes as bigger dots', async () => {
            await waitFor(() => {
                expect(
                    container.querySelectorAll(
                        "g[role='graphics-symbol'].volcanoPointSelected > path",
                    ),
                ).toHaveLength(1);
            });
        });

        it('should display highlighted genes as bigger colored dots', async () => {
            await waitFor(() => {
                expect(
                    container.querySelectorAll(
                        "g[role='graphics-symbol'].volcanoPointHighlighted > path[fill='#00BCD4']",
                    ),
                ).toHaveLength(1);
            });
        });
    });
});
