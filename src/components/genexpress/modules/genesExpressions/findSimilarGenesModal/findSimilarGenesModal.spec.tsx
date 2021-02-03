/* eslint-disable no-await-in-loop */
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
    customRender,
    getFetchMockCallsWithUrl,
    handleCommonRequests,
    resolveStringifiedObjectPromise,
} from 'tests/test-utils';
import {
    testState,
    generateGenesById,
    generateData,
    generateGeneSimilarity,
    mockStore,
    generateBasketExpression,
} from 'tests/mock';
import { RootState } from 'redux/rootReducer';
import _ from 'lodash';
import { DONE_DATA_STATUS, WAITING_DATA_STATUS } from '@genialis/resolwe/dist/api/types/rest';
import { formatNumber } from 'utils/math';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'mock-socket';
import GeneExpressGrid from 'components/genexpress/geneExpressGrid';
import { sessionId, webSocketUrl } from 'api/base';
import { GeneSimilarity } from 'redux/models/internal';
import { MockStoreEnhanced } from 'redux-mock-store';
import { AppDispatch } from 'redux/appStore';
import { fetchGenesSimilarities } from 'redux/epics/epicsActions';
import { genesSelected } from 'redux/stores/genes';
import { ProcessSlug } from 'components/genexpress/common/constants';
import FindSimilarGenesModal, { distanceMeasureOptions } from './findSimilarGenesModal';

const genesById = generateGenesById(4);
const genes = _.flatMap(genesById);
const genesSimilarities = genes.slice(0, 2).map((gene) => generateGeneSimilarity(gene.feature_id));
const differentGenesSimilarities = genes
    .slice(2)
    .map((gene) => generateGeneSimilarity(gene.feature_id));

const basketExpressions = [generateBasketExpression(), generateBasketExpression()];

const dataId = 123;
const storageId = 456;

const validateSimilarGenesGrid = async (
    genesSimilaritiesToValidate: GeneSimilarity[],
): Promise<void> => {
    if (genesSimilaritiesToValidate.length === 0) {
        return;
    }

    // Custom cells take the longest to render, whole grid is considered loaded when custom
    // cells are found.
    await screen.findAllByAltText('Open in dictyBase.');
    screen.getAllByAltText('Open in SACGB.');

    for (let i = 0; i < genesSimilaritiesToValidate.length; i += 1) {
        const geneToValidate = genesById[genesSimilaritiesToValidate[i].gene];
        screen.getByText(geneToValidate.description);
        screen.getByRole('gridcell', {
            name: geneToValidate.name,
        });
        screen.getByText(formatNumber(genesSimilaritiesToValidate[i].distance, 'long'));
    }
};

describe('findSimilarGenesModal', () => {
    let initialState: RootState;
    const mockedOnClose = jest.fn();

    beforeEach(() => {
        initialState = testState();
    });

    describe('process data exists', () => {
        beforeAll(() => {
            fetchMock.resetMocks();

            fetchMock.mockResponse((req) => {
                if (req.url.includes('get_or_create')) {
                    return resolveStringifiedObjectPromise({
                        id: dataId,
                    });
                }

                if (req.url.includes('data') && req.url.includes(dataId.toString())) {
                    return resolveStringifiedObjectPromise({
                        items: [
                            {
                                ...generateData(1),
                                ...{
                                    status: DONE_DATA_STATUS,
                                    output: {
                                        similar_genes: storageId,
                                    },
                                },
                            },
                        ],
                    });
                }

                if (req.url.includes('storage') && req.url.includes(storageId.toString())) {
                    return resolveStringifiedObjectPromise({
                        json: { 'similar genes': genesSimilarities },
                    });
                }

                if (req.url.includes('basket_expressions')) {
                    return resolveStringifiedObjectPromise(basketExpressions);
                }

                if (req.url.includes('list_by_ids')) {
                    return resolveStringifiedObjectPromise({ results: genes });
                }

                return (
                    handleCommonRequests(req) ?? Promise.reject(new Error(`bad url: ${req.url}`))
                );
            });
        });

        describe('genes similarities and similar genes not in store', () => {
            beforeEach(() => {
                initialState.genes.byId = generateGenesById(2);
                initialState.genes.selectedGenesIds = _.flatMap(initialState.genes.byId).map(
                    (gene) => gene.feature_id,
                );
                initialState.genesSimilarities.data = [];
                initialState.genesSimilarities.queryGeneId = _.flatMap(
                    initialState.genes.byId,
                )[0].feature_id;

                customRender(<FindSimilarGenesModal handleOnClose={mockedOnClose} />, {
                    initialState,
                });
            });

            it('should fetch genes similarities data (Find similar gene process) and display their data in data grid', async () => {
                await validateSimilarGenesGrid(genesSimilarities);
            });
        });

        describe('similar genes in store', () => {
            beforeEach(() => {
                initialState.genes.byId = genesById;
                initialState.genes.selectedGenesIds = genes
                    .slice(0, 2)
                    .map((gene) => gene.feature_id);
                initialState.genesSimilarities.data = differentGenesSimilarities;
                initialState.genesSimilarities.queryGeneId = genes[0].feature_id;

                customRender(<FindSimilarGenesModal handleOnClose={mockedOnClose} />, {
                    initialState,
                });
            });

            it('should fetch genes similarities data (Find similar gene process) and display their data in data grid', async () => {
                await validateSimilarGenesGrid(differentGenesSimilarities);
            });

            it('should call onClose when user clicks close button', () => {
                fireEvent.click(screen.getByText('Close'));

                expect(mockedOnClose.mock.calls.length).toBe(1);
            });

            it('should show different similarities data after user changes distance measure', async () => {
                await validateSimilarGenesGrid(differentGenesSimilarities);

                // Click on dropdown. MouseDown event has to be used, because material-ui Select component
                // listens to mouseDown event to expand options menu.
                fireEvent.mouseDown(screen.getByLabelText('Distance Measure'));
                fireEvent.click(await screen.findByText(distanceMeasureOptions[1].label));

                await validateSimilarGenesGrid(genesSimilarities);
            });

            it('should show different similarities data after user changes query gene', async () => {
                await validateSimilarGenesGrid(differentGenesSimilarities.slice(0, 2));

                // Click on dropdown. MouseDown event has to be used, because material-ui Select component
                // listens to mouseDown event to expand options menu.
                fireEvent.mouseDown(screen.getByLabelText('Gene'));
                fireEvent.click(await screen.findByText(genes[1].name));

                await validateSimilarGenesGrid(genesSimilarities.slice(0, 2));
            });
        });

        describe('similar genes in mocked store', () => {
            let mockedStore: MockStoreEnhanced<RootState, AppDispatch>;

            beforeEach(() => {
                initialState.genes.byId = genesById;
                initialState.genes.selectedGenesIds = genes
                    .slice(0, 2)
                    .map((gene) => gene.feature_id);
                initialState.genesSimilarities.data = differentGenesSimilarities;
                initialState.genesSimilarities.queryGeneId = genes[0].feature_id;

                mockedStore = mockStore(initialState);
                mockedStore.clearActions();

                customRender(<FindSimilarGenesModal handleOnClose={mockedOnClose} />, {
                    mockedStore,
                });
            });

            it('should call genesSelected with only selected gene when user clicks Select', async () => {
                fireEvent.click(screen.getByText(genes[3].name));

                await waitFor(() => {
                    expect(screen.getByText('Select')).toBeEnabled();
                });
                fireEvent.click(screen.getByText('Select'));

                await waitFor(() => {
                    expect(mockedStore.getActions()).toEqual([
                        fetchGenesSimilarities(),
                        genesSelected([genes[3].feature_id]),
                    ]);
                });
            });

            it('should call genesSelected with all similar genes when user clicks Select all', async () => {
                fireEvent.click(screen.getByText('Select all', { exact: false }));

                await waitFor(() => {
                    expect(mockedStore.getActions()).toEqual([
                        fetchGenesSimilarities(),
                        genesSelected(
                            _.flatMap(differentGenesSimilarities).map(
                                (geneSimilarity) => geneSimilarity.gene,
                            ),
                        ),
                    ]);
                });
            });
        });
    });

    describe("process data doesn't exist", () => {
        const observerId = uuidv4();
        let webSocketMock: WebSocket;

        beforeAll(() => {
            fetchMock.resetMocks();

            fetchMock.mockResponse(async (req) => {
                if (
                    req.url.includes('get_or_create') &&
                    (await req.json()).process.slug === ProcessSlug.findSimilar
                ) {
                    return resolveStringifiedObjectPromise({
                        id: dataId,
                    });
                }

                if (req.url.includes('data') && req.url.includes(dataId.toString())) {
                    return resolveStringifiedObjectPromise({
                        items: [
                            {
                                ...generateData(1),
                                ...{
                                    status: WAITING_DATA_STATUS,
                                    output: {},
                                },
                            },
                        ],
                        observer: observerId,
                    });
                }

                if (req.url.includes('basket_expressions')) {
                    return resolveStringifiedObjectPromise(basketExpressions);
                }

                if (req.url.includes('storage')) {
                    return resolveStringifiedObjectPromise({
                        json: { 'similar genes': genesSimilarities },
                    });
                }

                return (
                    handleCommonRequests(req) ?? Promise.reject(new Error(`bad url: ${req.url}`))
                );
            });
        });

        beforeEach(async () => {
            fetchMock.mockClear();

            const mockServer = new Server(webSocketUrl + sessionId);
            mockServer.on('connection', (socket) => {
                webSocketMock = socket;
            });

            initialState.genes.byId = genesById;
            initialState.genes.selectedGenesIds = genes.map((gene) => gene.feature_id);
            initialState.genesSimilarities.data = [];

            customRender(<GeneExpressGrid />, {
                initialState,
            });

            // Open Find similar genes modal.
            await waitFor(() => expect(screen.getByText('Find similar genes')).toBeEnabled());
            fireEvent.click(screen.getByText('Find similar genes'));
        });

        it('should fetch genes similarities data via WebSocket', async () => {
            // Wait for data object with 'waiting' status is returned.
            await waitFor(() => {
                expect(getFetchMockCallsWithUrl(`api/data?id=${dataId}`)).toHaveLength(1);
            });

            await waitFor(() => {
                webSocketMock.send(
                    JSON.stringify({
                        item: {
                            ...generateData(1),
                            ...{
                                status: DONE_DATA_STATUS,
                                output: {
                                    similar_genes: storageId,
                                },
                            },
                        },
                        msg: 'changed',
                        observer: observerId,
                        primary_key: 'id',
                    }),
                );
            });

            await validateSimilarGenesGrid(genesSimilarities);
        });
    });
});
