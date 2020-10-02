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
import { getTimeSeries } from 'redux/stores/timeSeries';
import _ from 'lodash';

const differentialExpressionsById = generateDifferentialExpressionsById(2);
const differentialExpressions = _.flatMap(differentialExpressionsById);

describe('differentialExpression not selected', () => {
    let container: HTMLElement;

    const initialTestState = testState();
    initialTestState.timeSeries.selectedId = getTimeSeries(initialTestState.timeSeries)[0].id;
    initialTestState.differentialExpressions.byId = differentialExpressionsById;
    const numberOfGenes = 5;

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

    it('should show volcano plot after differential expression is chosen', async () => {
        ({ container } = customRender(<GeneExpressGrid />, {
            initialState: initialTestState,
        }));
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

    describe('differentialExpression selected, one gene selected and one gene highlighted', () => {
        // TODO: after testing branch is merged, refactor setting up test state with different specifics.
        const filledInitialTestState = testState();
        filledInitialTestState.timeSeries.selectedId = getTimeSeries(
            initialTestState.timeSeries,
        )[0].id;
        filledInitialTestState.differentialExpressions.byId = differentialExpressionsById;
        const differentialExpressionJson = generateDifferentialExpressionJson(numberOfGenes);
        filledInitialTestState.differentialExpressions.byId[
            differentialExpressions[0].id
        ].json = differentialExpressionJson;
        filledInitialTestState.differentialExpressions.selectedId = differentialExpressions[0].id;
        filledInitialTestState.genes.byId = generateGenesByIdPredefinedIds(
            differentialExpressionJson.gene_id,
        );
        filledInitialTestState.genes.selectedGenesIds = [differentialExpressionJson.gene_id[0]];
        filledInitialTestState.genes.highlightedGenesIds = [differentialExpressionJson.gene_id[1]];

        beforeEach(async () => {
            ({ container } = customRender(<GeneExpressGrid />, {
                initialState: filledInitialTestState,
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
