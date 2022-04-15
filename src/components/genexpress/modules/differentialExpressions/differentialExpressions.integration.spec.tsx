import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import GeneExpressGrid from 'components/genexpress/geneExpressGrid';
import DifferentialExpressions from 'components/genexpress/modules/differentialExpressions/differentialExpressions';
import {
    customRender,
    handleCommonRequests,
    resolveStringifiedObjectPromise,
    validateCreateStateRequest,
    validateExportFile,
} from 'tests/test-utils';
import {
    testState,
    generateDifferentialExpressionsById,
    generateDifferentialExpressionJson,
    generateGenesByIdPredefinedIds,
    generateBookmarkQueryParameter,
    generateBackendBookmark,
} from 'tests/mock';
import _ from 'lodash';
import { RootState } from 'redux/rootReducer';
import { getSelectedDifferentialExpression } from 'redux/stores/differentialExpressions';

const differentialExpressionsById = generateDifferentialExpressionsById(2);
const differentialExpressions = _.flatMap(differentialExpressionsById);
const numberOfGenes = 5;
const differentialExpressionJson = generateDifferentialExpressionJson(numberOfGenes);
differentialExpressionsById[differentialExpressions[0].id].json = differentialExpressionJson;
const genesById = generateGenesByIdPredefinedIds(differentialExpressionJson.gene_id);

const backendBookmark = generateBackendBookmark(1, [
    differentialExpressionJson.gene_id[0],
    differentialExpressionJson.gene_id[1],
]);
backendBookmark.state.differentialExpressions.selectedId = differentialExpressions[0].id;

describe('differentialExpressions integration', () => {
    let initialState: RootState;
    let container: HTMLElement;

    it('should have differential expressions dropdown disabled without data', async () => {
        customRender(<DifferentialExpressions />);

        await waitFor(() => expect(screen.getByLabelText('Differential expression')).toBeEnabled());

        await waitFor(() =>
            expect(screen.getByLabelText('Differential expression')).toHaveClass('Mui-disabled'),
        );
    });

    beforeAll(() => {
        fetchMock.resetMocks();

        fetchMock.mockResponse((req) => {
            if (req.url.includes('differential_expression/list')) {
                return resolveStringifiedObjectPromise(differentialExpressions);
            }

            if (req.url.includes('storage')) {
                return resolveStringifiedObjectPromise({
                    id: differentialExpressions[0].output.de_json,
                    json: generateDifferentialExpressionJson(numberOfGenes),
                });
            }

            if (req.url.includes('app-state')) {
                return resolveStringifiedObjectPromise(backendBookmark);
            }

            return handleCommonRequests(req) ?? Promise.reject(new Error(`bad url: ${req.url}`));
        });
    });

    beforeEach(() => {
        initialState = testState();
        initialState.genes.byId = genesById;

        fetchMock.mockClear();
    });

    describe('differentialExpression not selected', () => {
        beforeEach(async () => {
            ({ container } = customRender(<GeneExpressGrid />, {
                initialState,
            }));

            await waitFor(() =>
                expect(screen.getByLabelText('Differential expression')).toBeEnabled(),
            );
        });

        it('should show volcano plot after differential expression is chosen', async () => {
            // Click on dropdown. MouseDown event has to be used, because material-ui Select component
            // listens to mouseDown event to expand options menu.
            fireEvent.mouseDown(screen.getByLabelText('Differential expression'));

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

        it('should export empty Differential Expressions/selected_differential_expression.tsv file', async () => {
            await validateExportFile(
                'Differential Expressions/selected_differential_expression.tsv',
                (exportFile) => {
                    expect(exportFile?.content).toEqual('');
                },
            );
        });

        it('should not export empty Differential Expressions/table.tsv file', async () => {
            await validateExportFile('Differential Expressions/table.tsv', (exportFile) => {
                expect(exportFile).toBeUndefined();
            });
        });

        it('should load selected differential expression, genes and highlighted genes from bookmark', async () => {
            jest.setTimeout(10000);

            ({ container } = customRender(<GeneExpressGrid />, {
                initialState,
                route: generateBookmarkQueryParameter(),
            }));

            await waitFor(() => {
                expect(
                    container.querySelectorAll(
                        "g[role='graphics-symbol'].volcanoPointSelected > path",
                    ),
                ).toHaveLength(backendBookmark.state.genes.selectedGenesIds.length);
                expect(
                    container.querySelectorAll(
                        "g[role='graphics-symbol'].volcanoPointHighlighted > path[fill='#00BCD4']",
                    ),
                ).toHaveLength(backendBookmark.state.genes.highlightedGenesIds.length);
            });
        });
    });

    describe('differentialExpression selected, one gene selected and one gene highlighted', () => {
        beforeEach(async () => {
            initialState.differentialExpressions.byId = differentialExpressionsById;
            initialState.differentialExpressions.selectedId = differentialExpressions[0].id;
            initialState.genes.byId = genesById;
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
                expect(screen.queryByText('Gene:')).toBeInTheDocument();
            });
        });

        it('should display selected gene as a bigger dot', async () => {
            await waitFor(() => {
                expect(
                    container.querySelectorAll(
                        "g[role='graphics-symbol'].volcanoPointSelected > path",
                    ),
                ).toHaveLength(1);
            });
        });

        it('should display highlighted gene as a bigger colored dot', async () => {
            await waitFor(() => {
                expect(
                    container.querySelectorAll(
                        "g[role='graphics-symbol'].volcanoPointHighlighted > path[fill='#00BCD4']",
                    ),
                ).toHaveLength(1);
            });
        });

        it('should export Differential Expressions/selected_differential_expression.tsv file', async () => {
            await validateExportFile(
                'Differential Expressions/selected_differential_expression.tsv',
                (exportFile) => {
                    expect(exportFile?.content).toContain(
                        getSelectedDifferentialExpression(initialState.differentialExpressions)
                            ?.name,
                    );
                },
            );
        });

        it('should export visualization Differential Expressions/volcano_image.png file', async () => {
            await validateExportFile('Differential Expressions/volcano_image.png', (exportFile) => {
                expect(exportFile).toBeDefined();
            });
        });

        it('should export visualization Differential Expressions/volcano_image.svg file', async () => {
            await validateExportFile('Differential Expressions/volcano_image.svg', (exportFile) => {
                expect(exportFile).toBeDefined();
            });
        });

        it('should export Differential Expressions/caption.txt file', async () => {
            await validateExportFile('Differential Expressions/caption.txt', (exportFile) => {
                expect(exportFile?.content).toContain('Differential expression');
                expect(exportFile?.content).toContain(
                    getSelectedDifferentialExpression(initialState.differentialExpressions)?.name,
                );
            });
        });

        it('should save selected time series, genes, highlighted genes and all component bookmarkable state to app-state api', async () => {
            fireEvent.click(screen.getByLabelText('Bookmark'));

            await validateCreateStateRequest((bookmarkState) => {
                expect(bookmarkState.differentialExpressions.selectedId).toEqual(
                    initialState.differentialExpressions.selectedId,
                );
            });
        });
    });
});
