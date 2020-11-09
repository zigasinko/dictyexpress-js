import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { customRender } from 'tests/test-utils';
import {
    testState,
    mockStore,
    generateGenesById,
    generateGeneOntologyStorageJson,
    generateGOEnrichmentRow,
} from 'tests/mock';
import { RootState } from 'redux/rootReducer';
import _ from 'lodash';
import { EnhancedGOEnrichmentJson } from 'redux/models/internal';
import { MockStoreEnhanced } from 'redux-mock-store';
import { AppDispatch } from 'redux/appStore';
import GOEnrichment from './gOEnrichment';
import { appendMissingAttributesToJson } from './gOEnrichmentUtils';

const genesById = generateGenesById(2);
const genes = _.flatMap(genesById);

describe('gOEnrichment', () => {
    let initialState: RootState;

    describe('gOEnrichmentJson and genes empty', () => {
        let unmount: () => boolean;

        beforeEach(() => {
            initialState = testState();
            initialState.gOEnrichment.json = {} as EnhancedGOEnrichmentJson;

            ({ unmount } = customRender(<GOEnrichment />, {
                initialState,
            }));
        });

        it('should have aspect disabled and p-value disabled', () => {
            expect(screen.getByLabelText('Aspect')).toHaveClass('Mui-disabled');
            expect(screen.getByLabelText('p-value')).toHaveClass('Mui-disabled');
        });

        it('should display a message that enriched terms were not found', () => {
            screen.getByText('Enriched terms not found.');
        });

        describe('gene selected', () => {
            beforeEach(() => {
                initialState.genes.byId = genesById;
                initialState.genes.selectedGenesIds = [genes[0].feature_id];

                unmount();
                customRender(<GOEnrichment />, {
                    initialState,
                });
            });

            it('should enable p-value select if gene is selected', () => {
                screen.getByText('Enriched terms not found.');
            });
        });
    });

    describe('gOEnrichmentJson is in store', () => {
        let mockedStore: MockStoreEnhanced<RootState, AppDispatch>;
        let container: HTMLElement;

        beforeEach(async () => {
            initialState = testState();
            initialState.gOEnrichment.json = generateGeneOntologyStorageJson(
                genes.map((gene) => gene.feature_id),
            );

            initialState.gOEnrichment.json.tree.MF = [];
            initialState.gOEnrichment.json.tree.BB = [
                generateGOEnrichmentRow(10),
                generateGOEnrichmentRow(11),
            ];
            appendMissingAttributesToJson(
                initialState.gOEnrichment.json,
                genes[0].source,
                genes[0].species,
            );

            initialState.genes.byId = genesById;
            initialState.genes.selectedGenesIds = [genes[0].feature_id];

            mockedStore = mockStore(initialState);
            fetchMock.mockResponse(JSON.stringify({ results: genes }));

            ({ container } = customRender(<GOEnrichment />, {
                mockedStore,
            }));

            // Wait for first aspect (Biological process) rows to render.
            await waitFor(
                () => {
                    screen.getByText(initialState.gOEnrichment.json.tree.BP[0].term_name);
                },
                { timeout: 2500 },
            );
        });

        it('should display a message that enriched terms for selected aspect were not found', async () => {
            // Click on dropdown. MouseDown event has to be used, because material-ui Select component
            // listens to mouseDown event to expand options menu.
            fireEvent.mouseDown(screen.getByLabelText('Aspect'));

            fireEvent.click(await screen.findByText('Molecular function'));

            screen.findByText('Enriched terms not found within selected aspect.');
        });

        it('should display score in a custom cell', () => {
            screen.getAllByRole('progressbar');
        });

        it('should display matched in a custom cell', () => {
            const rowToCheck = initialState.gOEnrichment.json.tree.BB[0];
            screen.getAllByText(`${rowToCheck.matched}/${rowToCheck.total}`);
        });

        it('should display term in a custom cell', () => {
            expect(container.querySelector('.ag-react-container svg')).toBeInTheDocument();
        });

        it('should switch between flat and tree view when user clicks "Flat"/"Hierarchy" button', async () => {
            fireEvent.click(screen.getByText('Flat'));

            await waitFor(() => {
                expect(container.querySelector('.ag-react-container svg')).not.toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Hierarchy'));

            await waitFor(() => {
                expect(container.querySelector('.ag-react-container svg')).toBeInTheDocument();
            });
        });

        it('should switch to flat view when user clicks any sort button (except term)', async () => {
            // If user clicks on "Term" header, nothing should change.
            fireEvent.click(screen.getByText('Term'));

            await waitFor(() => {
                expect(container.querySelector('.ag-react-container svg')).toBeInTheDocument();
            });

            // If user clicks on "Score" header, view should change -> flat grid with sorting.
            fireEvent.click(screen.getByText('Score'));

            await waitFor(() => {
                expect(container.querySelector('.ag-react-container svg')).not.toBeInTheDocument();
            });
        });
    });
});
