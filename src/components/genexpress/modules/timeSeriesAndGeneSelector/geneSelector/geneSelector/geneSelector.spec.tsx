import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { customRender } from 'tests/test-utils';
import { SamplesInfo } from 'redux/models/internal';
import { generateGene } from 'tests/mock';
import { BasketInfoData } from 'components/genexpress/common/constants';
import { GeneSelector } from './geneSelector';

const genes = [generateGene(1), generateGene(2)];
const genesNames = genes.map((gene) => gene.name);

describe('geneSelector', () => {
    it('should be disabled if selectedSamplesInfo is empty', () => {
        customRender(
            <GeneSelector
                selectedSamplesInfo={{} as SamplesInfo}
                selectedGenes={[]}
                highlightedGenesNames={[]}
                isFetchingPastedGenes={false}
                connectedSelectGenes={(): void => {}}
                connectedPasteGenesNames={(): Promise<string[]> => {
                    return Promise.resolve([]);
                }}
            />,
        );

        // "Search for a gene" input has to be disabled until time series is chosen.
        expect(screen.getByPlaceholderText('Search for a gene')).toBeDisabled();
    });

    describe('selectedSamplesInfo not empty', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let mockedConnectedPasteGenesNames: jest.Mock<any, any>;

        beforeEach(() => {
            mockedConnectedPasteGenesNames = jest.fn().mockReturnValue([genesNames[1]]);

            fetchMock.mockResponse(JSON.stringify({ results: [{ name: 'aaa' }] }));

            customRender(
                <GeneSelector
                    selectedSamplesInfo={{
                        source: BasketInfoData.SOURCE,
                        species: BasketInfoData.SPECIES,
                        type: 'gene',
                    }}
                    selectedGenes={[]}
                    highlightedGenesNames={[]}
                    isFetchingPastedGenes={false}
                    connectedSelectGenes={(): void => {}}
                    connectedPasteGenesNames={mockedConnectedPasteGenesNames}
                />,
            );
        });

        it('should call connectedPasteGenesNames after user pastes genes names to input', async () => {
            // Paste genes names to "Search for a gene" input.
            fireEvent.paste(screen.getByPlaceholderText('Search for a gene'), {
                clipboardData: { getData: jest.fn().mockReturnValueOnce(genesNames.join(',')) },
            });

            expect(mockedConnectedPasteGenesNames.mock.calls.length).toBe(1);
            expect(mockedConnectedPasteGenesNames.mock.calls[0][0]).toEqual(genesNames);

            await screen.findByDisplayValue(genesNames[1]);
        });

        it('should call connectedPasteGenesNames after user drops a file to input', async () => {
            const genesNamesFile = new File([genesNames.join()], 'file.txt', {
                type: 'text/plain',
            });

            // Drop file with genes names to "Search for a gene" input.
            fireEvent.drop(screen.getByPlaceholderText('Search for a gene'), {
                dataTransfer: {
                    files: [genesNamesFile],
                },
            });

            await screen.findByDisplayValue(genesNames[1]);

            expect(mockedConnectedPasteGenesNames.mock.calls.length).toBe(1);
            expect(mockedConnectedPasteGenesNames.mock.calls[0][0]).toEqual(genesNames);
        });
    });

    describe('selectedGenes not empty', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let mockedConnectedSelectGenes: jest.Mock<any, any>;

        beforeEach(() => {
            fetchMock.resetMocks();
            fetchMock.mockResponse(JSON.stringify({ results: genes }));
            mockedConnectedSelectGenes = jest.fn();

            customRender(
                <GeneSelector
                    selectedSamplesInfo={{
                        source: BasketInfoData.SOURCE,
                        species: BasketInfoData.SPECIES,
                        type: 'gene',
                    }}
                    selectedGenes={[genes[0]]}
                    highlightedGenesNames={[]}
                    isFetchingPastedGenes={false}
                    connectedSelectGenes={mockedConnectedSelectGenes}
                    connectedPasteGenesNames={(): Promise<string[]> => {
                        return Promise.resolve([]);
                    }}
                />,
            );
        });

        it('should exclude already selected genes in autocomplete', async () => {
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

        it('should call connectedSelectGenes after user select a gene from autocomplete', async () => {
            fireEvent.change(screen.getByPlaceholderText('Search for a gene'), {
                target: { value: genes[1].name.slice(0, 1) },
            });

            fireEvent.click(await screen.findByText(genes[1].name));

            expect(mockedConnectedSelectGenes.mock.calls.length).toBe(1);
            expect(mockedConnectedSelectGenes.mock.calls[0][0]).toEqual(genes);
        });
    });
});
