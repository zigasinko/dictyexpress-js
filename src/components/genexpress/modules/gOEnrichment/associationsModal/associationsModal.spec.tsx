import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
    customRender,
    handleCommonRequests,
    resolveStringifiedObjectPromise,
} from 'tests/test-utils';
import {
    testState,
    mockStore,
    generateGeneOntologyStorageJson,
    generateGenesByIdPredefinedIds,
} from 'tests/mock';
import { MockStoreEnhanced } from 'redux-mock-store';
import { RootState } from 'redux/rootReducer';
import { AppDispatch } from 'redux/appStore';
import _ from 'lodash';
import { genesSelected } from 'redux/stores/genes';
import { fetchAssociationsGenes } from 'redux/epics/epicsActions';
import { GeneMapping, GOEnrichmentRow } from 'redux/models/internal';
import { appendMissingAttributesToJson } from 'utils/gOEnrichmentUtils';
import GOEnrichmentAssociationsModal from './associationsModal';

const genesById = generateGenesByIdPredefinedIds(['gene1', 'gene2', 'gene3']);
const genes = _.flatMap(genesById);

const genesMappings: GeneMapping[] = [
    { source_db: 'DICTYBASE', source_id: 'gene1', target_db: 'UniProtKB', target_id: 'Q55eR8' },
    { source_db: 'DICTYBASE', source_id: 'gene2', target_db: 'UniProtKB', target_id: 'Q54PU2' },
    { source_db: 'DICTYBASE', source_id: 'gene3', target_db: 'UniProtKB', target_id: 'Q54L63' },
];

describe('associationsModal', () => {
    let initialState: RootState;
    const mockedOnClose = jest.fn();
    let gOEnrichmentRow: GOEnrichmentRow;

    beforeAll(() => {
        fetchMock.resetMocks();

        fetchMock.mockResponse((req) => {
            if (req.url.includes('list_by_ids')) {
                return resolveStringifiedObjectPromise({
                    results: genes,
                });
            }

            if (req.url.includes('mapping/search')) {
                return resolveStringifiedObjectPromise(genesMappings);
            }

            return handleCommonRequests(req) ?? Promise.reject(new Error(`bad url: ${req.url}`));
        });
    });

    describe('associated genes not in store', () => {
        beforeEach(() => {
            initialState = testState();
            initialState.genes.byId = genesById;
            initialState.gOEnrichment.json = generateGeneOntologyStorageJson(
                genesMappings.map((geneMapping) => geneMapping.target_id),
            );
            appendMissingAttributesToJson(
                initialState.gOEnrichment.json,
                'ENSEMBL',
                'Homo sapiens',
            );

            [gOEnrichmentRow] = initialState.gOEnrichment.json.tree.BP;

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
            for (let i = 0; i < genesMappings.length; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                await screen.findByText(genesById[genesMappings[i].source_id].name);
            }
        });

        it('should call onClose when user clicks close button', () => {
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
                await screen.findByText(initialState.genes.byId[geneId].name);
            }
        });

        it('should call genesSelected with only selected gene when user clicks Select', async () => {
            fireEvent.click(
                (
                    await screen.findAllByLabelText(
                        'Press Space to toggle row selection (unchecked)',
                    )
                )[0],
            );
            await waitFor(() => {
                expect(screen.getByText('Select')).toBeEnabled();
            });
            fireEvent.click(screen.getByText('Select'));

            await waitFor(() => {
                expect(mockedStore.getActions()).toEqual([
                    fetchAssociationsGenes({
                        geneIds: gOEnrichmentRow.gene_associations,
                    }),
                    genesSelected([genes[0].feature_id]),
                ]);
            });
        });

        it('should call genesSelected with all genes when user clicks Select all', async () => {
            fireEvent.click(
                (
                    await screen.findAllByLabelText(
                        'Press Space to toggle row selection (unchecked)',
                    )
                )[0],
            );
            await waitFor(() => {
                expect(screen.getByText('Select')).toBeEnabled();
            });
            fireEvent.click(screen.getByText('Select all', { exact: false }));

            await waitFor(() => {
                expect(mockedStore.getActions()).toEqual([
                    fetchAssociationsGenes({
                        geneIds: gOEnrichmentRow.gene_associations,
                    }),
                    genesSelected(genes.map((gene) => gene.feature_id)),
                ]);
            });
        });
    });
});
