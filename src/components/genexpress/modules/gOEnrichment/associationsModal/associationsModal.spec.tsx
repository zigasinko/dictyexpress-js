import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { customRender } from 'tests/test-utils';
import {
    testState,
    mockStore,
    generateGenesById,
    generateGeneOntologyStorageJson,
} from 'tests/mock';
import { MockStoreEnhanced } from 'redux-mock-store';
import { RootState } from 'redux/rootReducer';
import { AppDispatch } from 'redux/appStore';
import _ from 'lodash';
import { genesSelected } from 'redux/stores/genes';
import { fetchAssociationsGenes } from 'redux/epics/epicsActions';
import { GOEnrichmentRow } from 'redux/models/internal';
import { appendMissingAttributesToJson } from 'utils/gOEnrichmentUtils';
import GOEnrichmentAssociationsModal from './associationsModal';

const genesById = generateGenesById(2);
const genes = _.flatMap(genesById);

describe('associationsModal', () => {
    let initialState: RootState;
    const mockedOnClose = jest.fn();
    let gOEnrichmentRow: GOEnrichmentRow;

    describe('associated genes not in store', () => {
        beforeEach(() => {
            initialState = testState();
            initialState.gOEnrichment.json = generateGeneOntologyStorageJson(
                genes.map((gene) => gene.feature_id),
            );
            appendMissingAttributesToJson(
                initialState.gOEnrichment.json,
                'ENSEMBL',
                'Homo sapiens',
            );

            [gOEnrichmentRow] = initialState.gOEnrichment.json.tree.BP;

            fetchMock.mockResponse(JSON.stringify({ results: genes }));

            customRender(
                <GOEnrichmentAssociationsModal
                    gOEnrichmentRow={gOEnrichmentRow}
                    handleOnClose={mockedOnClose}
                />,
                {
                    initialState,
                },
            );
        });

        it('should fetch associated genes data and display it in grid', async () => {
            for (let i = 0; i < gOEnrichmentRow.gene_associations.length; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                await screen.findByText(genesById[gOEnrichmentRow.gene_associations[i]].full_name);
            }
        });

        it('should call onClose when user clicks close button', () => {
            // Simulate click on first gene set.
            fireEvent.click(screen.getByText('Close'));

            expect(mockedOnClose.mock.calls.length).toBe(1);
        });
    });

    describe('associated genes in store', () => {
        let mockedStore: MockStoreEnhanced<RootState, AppDispatch>;

        beforeEach(() => {
            initialState = testState();
            initialState.genes.byId = genesById;
            initialState.gOEnrichment.json = generateGeneOntologyStorageJson(
                genes.map((gene) => gene.feature_id),
            );
            appendMissingAttributesToJson(
                initialState.gOEnrichment.json,
                'ENSEMBL',
                'Homo sapiens',
            );

            [gOEnrichmentRow] = initialState.gOEnrichment.json.tree.BP;

            mockedStore = mockStore(initialState);
            mockedStore.clearActions();

            fetchMock.mockResponse(JSON.stringify({ results: genes }));

            customRender(
                <GOEnrichmentAssociationsModal
                    gOEnrichmentRow={gOEnrichmentRow}
                    handleOnClose={mockedOnClose}
                />,
                {
                    mockedStore,
                },
            );
        });

        it('should display associated genes data in grid', async () => {
            for (let i = 0; i < gOEnrichmentRow.gene_associations.length; i += 1) {
                const geneId = gOEnrichmentRow.gene_associations[i];
                // eslint-disable-next-line no-await-in-loop
                await screen.findByText(initialState.genes.byId[geneId].full_name);
            }
        });

        it('should call genesSelected with only selected gene when user clicks Select', async () => {
            // Simulate select first row (gene set).
            fireEvent.click(
                screen.getAllByLabelText('Press Space to toggle row selection (unchecked)')[0],
            );
            await waitFor(() => {
                expect(screen.getByText('Select')).toBeEnabled();
            });
            fireEvent.click(screen.getByText('Select'));

            await waitFor(() => {
                expect(mockedStore.getActions()).toEqual([
                    fetchAssociationsGenes({
                        geneIds: gOEnrichmentRow.gene_associations,
                        source: genes[0].source,
                        species: genes[0].species,
                    }),
                    genesSelected([genes[0].feature_id]),
                ]);
            });
        });

        it('should call genesSelected with all genes when user clicks Select all', async () => {
            // Simulate select first row (gene set).
            fireEvent.click(
                screen.getAllByLabelText('Press Space to toggle row selection (unchecked)')[0],
            );
            await waitFor(() => {
                expect(screen.getByText('Select')).toBeEnabled();
            });
            fireEvent.click(screen.getByText('Select all', { exact: false }));

            await waitFor(() => {
                expect(mockedStore.getActions()).toEqual([
                    fetchAssociationsGenes({
                        geneIds: gOEnrichmentRow.gene_associations,
                        source: genes[0].source,
                        species: genes[0].species,
                    }),
                    genesSelected(genes.map((gene) => gene.feature_id)),
                ]);
            });
        });
    });
});
