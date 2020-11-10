import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { customRender, validateExportFile } from 'tests/test-utils';
import { testState, mockStore, generateGenesById } from 'tests/mock';
import { allGenesDeselected, genesFetchSucceeded, genesSelected } from 'redux/stores/genes';
import { MockStoreEnhanced } from 'redux-mock-store';
import { RootState } from 'redux/rootReducer';
import { AppDispatch } from 'redux/appStore';
import _ from 'lodash';
import GeneSelector from './geneSelector';

const genesById = generateGenesById(2);
const genes = _.flatMap(genesById);
const testGenesNames = genes.map((gene) => gene.name);

describe('geneSelector', () => {
    let initialState: RootState;

    beforeEach(() => {
        initialState = testState();
        initialState.timeSeries.basketInfo = {
            id: '1',
            source: 'DICTYBASE',
            species: 'Dictyostelium purpureum',
            type: 'gene',
        };
    });

    it('should be disabled if basketInfo is empty', () => {
        customRender(<GeneSelector />);

        // "Search for a gene" input has to be disabled until time series is chosen.
        expect(screen.getByPlaceholderText('Search for a gene')).toBeDisabled();
    });

    describe('no genes selected', () => {
        let mockedStore: MockStoreEnhanced<RootState, AppDispatch>;

        beforeEach(() => {
            initialState.genes.byId = {};
            initialState.genes.selectedGenesIds = [];
            mockedStore = mockStore(initialState);
            mockedStore.clearActions();

            customRender(<GeneSelector />, {
                mockedStore,
            });
        });

        it('should dispatch genesSelected action after user pastes genes names to "Search for a gene" input', async () => {
            fetchMock.mockResponse(JSON.stringify({ results: genes }));

            // Paste genes names to "Search for a gene" input.
            fireEvent.paste(screen.getByPlaceholderText('Search for a gene'), {
                clipboardData: { getData: jest.fn().mockReturnValueOnce(testGenesNames.join(',')) },
            });

            await waitFor(() => {
                expect(mockedStore.getActions()).toEqual([
                    genesFetchSucceeded(genes),
                    allGenesDeselected(),
                    genesSelected(genes.map((gene) => gene.feature_id)),
                ]);
            });
        });

        it('should dispatch genesSelected action after user drops a file wih genes names to "Search for a gene" input', async () => {
            fetchMock.mockResponse(JSON.stringify({ results: genes }));

            const genesNamesFile = new File([testGenesNames.join()], 'file.txt', {
                type: 'text/plain',
            });

            // Drop file with genes names to "Search for a gene" input.
            fireEvent.drop(screen.getByPlaceholderText('Search for a gene'), {
                dataTransfer: {
                    files: [genesNamesFile],
                },
            });

            await waitFor(() => {
                expect(mockedStore.getActions()).toEqual([
                    genesFetchSucceeded(genes),
                    allGenesDeselected(),
                    genesSelected(genes.map((gene) => gene.feature_id)),
                ]);
            });
        });

        it('should dispatch genesSelected action after user selects a gene from autocomplete', async () => {
            fireEvent.change(screen.getByPlaceholderText('Search for a gene'), {
                target: { value: genes[1].name.slice(0, 1) },
            });

            await waitFor(() => fireEvent.click(screen.getByText(genes[1].name)));

            await waitFor(() =>
                expect(mockedStore.getActions()).toEqual([
                    genesFetchSucceeded([genes[1]]),
                    genesSelected([genes[1].feature_id]),
                ]),
            );
        });

        it('should export empty Genes/selected_genes.tsv file', async () => {
            await validateExportFile('Genes/selected_genes.tsv', (exportFile) => {
                expect(exportFile).toBeDefined();
                expect(exportFile?.content).toEqual('');
            });
        });

        it('should export empty Genes/highlighted_genes.tsv file', async () => {
            await validateExportFile('Genes/selected_genes.tsv', (exportFile) => {
                expect(exportFile).toBeDefined();
                expect(exportFile?.content).toEqual('');
            });
        });
    });

    describe('genes already selected', () => {
        beforeEach(() => {
            initialState.genes.byId = genesById;
            initialState.genes.selectedGenesIds = genes.map((gene) => gene.feature_id);

            customRender(<GeneSelector />, {
                initialState,
            });
        });

        it('should exclude already selected genes in autocomplete', async () => {
            fetchMock.resetMocks();
            fetchMock.mockResponse(JSON.stringify({ results: genes }));

            fireEvent.change(screen.getByPlaceholderText('Search for a gene'), {
                target: { value: genes[1].name.slice(0, 1) },
            });

            // Autocomplete returns both test genes.
            // First one should only be visible in as a chip in 'selectedGenes' child component.
            await waitFor(() => {
                expect(screen.getAllByText(genes[0].name)).toHaveLength(1);
            });

            // Second one should only be visible in autocomplete dropdown.
            await waitFor(() => {
                expect(screen.getAllByText(genes[1].name)).toHaveLength(1);
            });
        });

        it('should export filled Genes/selected_genes.tsv file', async () => {
            await validateExportFile('Genes/selected_genes.tsv', (exportFile) => {
                expect(exportFile?.content).toContain(genes[0].name);
                expect(exportFile?.content).toContain(genes[0].full_name);
            });
        });

        it('should export empty Genes/highlighted_genes.tsv file', async () => {
            await validateExportFile('Genes/highlighted_genes.tsv', (exportFile) => {
                expect(exportFile?.content).toEqual('');
            });
        });
    });

    describe('genes already selected and highlighted', () => {
        beforeEach(() => {
            initialState.genes.byId = genesById;
            initialState.genes.selectedGenesIds = genes.map((gene) => gene.feature_id);
            initialState.genes.highlightedGenesIds = [genes[0].feature_id];

            customRender(<GeneSelector />, {
                initialState,
            });
        });

        it('should export filled Genes/selected_genes.tsv file', async () => {
            await validateExportFile('Genes/selected_genes.tsv', (exportFile) => {
                for (let i = 1; i < initialState.genes.selectedGenesIds.length; i += 1) {
                    const selectedGene = genesById[initialState.genes.selectedGenesIds[i]];
                    expect(exportFile?.content).toContain(selectedGene.name);
                    expect(exportFile?.content).toContain(selectedGene.full_name);
                }
            });
        });

        it('should export empty Genes/highlighted_genes.tsv file', async () => {
            await validateExportFile('Genes/highlighted_genes.tsv', (exportFile) => {
                for (let i = 1; i < initialState.genes.highlightedGenesIds.length; i += 1) {
                    const highlightedGene = genesById[initialState.genes.highlightedGenesIds[i]];
                    expect(exportFile?.content).toContain(highlightedGene.name);
                    expect(exportFile?.content).toContain(highlightedGene.full_name);
                }
            });
        });
    });
});
