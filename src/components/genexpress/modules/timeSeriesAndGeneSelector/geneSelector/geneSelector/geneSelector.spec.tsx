import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { customRender } from 'tests/test-utils';
import { testState, mockStore, generateGenesById } from 'tests/mock';
import { genesSelected } from 'redux/stores/genes';
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
        initialState.timeSeries.selectedSamplesInfo = {
            source: 'DICTYBASE',
            species: 'Dictyostelium purpureum',
            type: 'gene',
        };
    });

    it('should be disabled if selectedSamplesInfo is empty', () => {
        customRender(<GeneSelector />);

        // "Search for a gene" input has to be disabled until time series is chosen.
        expect(screen.getByPlaceholderText('Search for a gene')).toBeDisabled();
    });

    describe('no genes selected', () => {
        let mockedStore: MockStoreEnhanced<RootState, AppDispatch>;

        beforeEach(() => {
            initialState.selectedGenes.byId = {};
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
                expect(mockedStore.getActions()).toEqual([genesSelected(genes)]);
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
                expect(mockedStore.getActions()).toEqual([genesSelected(genes)]);
            });
        });

        it('should dispatch genesSelected action after user selects a gene from autocomplete', async () => {
            fireEvent.change(screen.getByPlaceholderText('Search for a gene'), {
                target: { value: 'T' },
            });

            await waitFor(() => fireEvent.click(screen.getByText(genes[1].name)));

            await waitFor(() =>
                expect(mockedStore.getActions()).toEqual([genesSelected([genes[1]])]),
            );
        });
    });

    describe('genes already selected', () => {
        let mockedStore: MockStoreEnhanced<RootState, AppDispatch>;

        beforeEach(() => {
            initialState.selectedGenes.byId = genesById;
            mockedStore = mockStore(initialState);
            mockedStore.clearActions();

            customRender(<GeneSelector />, {
                mockedStore,
            });
        });

        it('should exclude already selected genes in autocomplete', async () => {
            fetchMock.resetMocks();
            fetchMock.mockResponse(JSON.stringify({ results: genes }));

            fireEvent.change(screen.getByPlaceholderText('Search for a gene'), {
                target: { value: 'T' },
            });

            await waitFor(() => {
                expect(screen.getAllByText(genes[0].name)).toHaveLength(1);
                expect(screen.getAllByText(genes[1].name)).toHaveLength(1);
            });
        });
    });
});
