/* eslint-disable no-await-in-loop */
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import GeneExpressGrid from 'components/genexpress/geneExpressGrid';
import { customRender, handleCommonRequests } from 'tests/test-utils';
import {
    testState,
    generateGenesById,
    generateGeneOntologyStorageJson,
    generateGaf,
    generateData,
} from 'tests/mock';
import _ from 'lodash';
import { RootState } from 'redux/rootReducer';
import {
    DataGafAnnotation,
    DONE_DATA_STATUS,
    WAITING_DATA_STATUS,
} from '@genialis/resolwe/dist/api/types/rest';
import { v4 as uuidv4 } from 'uuid';
import { Server, WebSocket } from 'mock-socket';
import { sessionId, webSocketUrl } from 'api/base';
import { appendMissingAttributesToJson } from 'utils/gOEnrichmentUtils';
import { aspectOptions } from './gOEnrichment';

const genesById = generateGenesById(2);
const genes = _.flatMap(genesById);
const gOEnrichmentJson = generateGeneOntologyStorageJson(genes.map((gene) => gene.feature_id));
appendMissingAttributesToJson(gOEnrichmentJson, genes[0].source, genes[0].species);
const differentGOEnrichmentJson = generateGeneOntologyStorageJson(
    genes.map((gene) => gene.feature_id),
);
appendMissingAttributesToJson(differentGOEnrichmentJson, genes[0].source, genes[0].species);
const { humanGaf, mouseMGIGaf, mouseUCSCGaf } = generateGaf(1);
const dataObjectId = 123;

describe('goEnrichment integration', () => {
    let initialState: RootState;

    describe('process data exists', () => {
        beforeAll(() => {
            fetchMock.resetMocks();

            fetchMock.mockResponse((req) => {
                if (req.url.includes('get_or_create')) {
                    return Promise.resolve(
                        JSON.stringify({
                            id: dataObjectId,
                        }),
                    );
                }

                if (decodeURIComponent(req.url).includes('data:gaf')) {
                    return Promise.resolve(JSON.stringify([humanGaf, mouseMGIGaf, mouseUCSCGaf]));
                }

                if (req.url.includes('data') && req.url.includes(dataObjectId.toString())) {
                    return Promise.resolve(
                        JSON.stringify({
                            items: [
                                {
                                    ...generateData(1),
                                    ...{
                                        status: DONE_DATA_STATUS,
                                        output: {
                                            terms: 1,
                                            species: genes[0].species,
                                            source: genes[0].source,
                                        },
                                    },
                                },
                            ],
                        }),
                    );
                }

                if (req.url.includes('storage')) {
                    return Promise.resolve(
                        JSON.stringify({
                            json: gOEnrichmentJson,
                        }),
                    );
                }

                if (req.url.includes('autocomplete')) {
                    return Promise.resolve(
                        JSON.stringify({
                            results: [genes[0], genes[1]],
                        }),
                    );
                }

                return (
                    handleCommonRequests(req) ?? Promise.reject(new Error(`bad url: ${req.url}`))
                );
            });
        });

        describe('gaf not fetched yet', () => {
            beforeEach(() => {
                initialState = testState();
                initialState.gOEnrichment.gaf = {} as DataGafAnnotation;

                customRender(<GeneExpressGrid />, {
                    initialState,
                });
            });

            it('should show enrichment terms in a data grid after genes are chosen', async () => {
                fireEvent.change(screen.getByPlaceholderText('Search for a gene'), {
                    target: { value: genes[0].name.slice(0, 2) },
                });

                fireEvent.click(await screen.findByText(genes[0].name));

                await screen.findByText(gOEnrichmentJson.tree.BP[0].term_name);
            });
        });

        describe('gaf already in store', () => {
            beforeEach(() => {
                initialState = testState();
                initialState.gOEnrichment.gaf = humanGaf;
            });

            it('should show enrichment terms in a data grid after genes are chosen', async () => {
                customRender(<GeneExpressGrid />, {
                    initialState,
                });

                fireEvent.change(screen.getByPlaceholderText('Search for a gene'), {
                    target: { value: genes[0].name.slice(0, 2) },
                });

                fireEvent.click(await screen.findByText(genes[0].name));

                await screen.findByText(gOEnrichmentJson.tree.BP[0].term_name);
            });
        });

        describe('gaf and data already in store', () => {
            beforeEach(() => {
                initialState = testState();
                initialState.gOEnrichment.gaf = humanGaf;
                initialState.genes.byId = genesById;
                initialState.genes.selectedGenesIds = [genes[0].feature_id];
                initialState.gOEnrichment.json = differentGOEnrichmentJson;

                customRender(<GeneExpressGrid />, {
                    initialState,
                });
            });

            it('should show different enrichment terms after user changes p-value', async () => {
                // Click on dropdown. MouseDown event has to be used, because material-ui Select component
                // listens to mouseDown event to expand options menu.
                fireEvent.mouseDown(screen.getByLabelText('p-value'));
                fireEvent.click(await screen.findByText('0.001'));

                await screen.findByText(gOEnrichmentJson.tree.BP[0].term_name);
            });

            it('should show different enrichment terms in a data grid user changes aspect', async () => {
                // Loop through all remaining aspect options and check if data grid is refreshing accordingly.
                for (let i = 1; i < aspectOptions.length; i += 1) {
                    const aspectOption = aspectOptions[i];

                    // Click on dropdown. MouseDown event has to be used, because material-ui Select component
                    // listens to mouseDown event to expand options menu.
                    fireEvent.mouseDown(screen.getByLabelText('Aspect'));
                    fireEvent.click(await screen.findByText(aspectOption.label));

                    await screen.findByText(
                        differentGOEnrichmentJson.tree[aspectOption.value][0].term_name,
                    );
                }
            });
        });
    });

    describe("process data doesn't exist", () => {
        const observerId = uuidv4();
        let webSocketMock: WebSocket;

        beforeAll(() => {
            fetchMock.resetMocks();

            fetchMock.mockResponse((req) => {
                if (req.url.includes('get_or_create')) {
                    return Promise.resolve(
                        JSON.stringify({
                            id: dataObjectId,
                        }),
                    );
                }

                if (req.url.includes('data:gaf')) {
                    return Promise.resolve(JSON.stringify([humanGaf, mouseMGIGaf, mouseUCSCGaf]));
                }

                if (req.url.includes('data') && req.url.includes(dataObjectId.toString())) {
                    return Promise.resolve(
                        JSON.stringify({
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
                        }),
                    );
                }

                if (req.url.includes('storage')) {
                    return Promise.resolve(
                        JSON.stringify({
                            json: gOEnrichmentJson,
                        }),
                    );
                }

                if (req.url.includes('autocomplete')) {
                    return Promise.resolve(
                        JSON.stringify({
                            results: [genes[0], genes[1]],
                        }),
                    );
                }

                return (
                    handleCommonRequests(req) ?? Promise.reject(new Error(`bad url: ${req.url}`))
                );
            });
        });

        beforeEach(() => {
            initialState = testState();
            initialState.gOEnrichment.gaf = humanGaf;

            const mockServer = new Server(webSocketUrl + sessionId);
            mockServer.on('connection', (socket) => {
                webSocketMock = socket;
            });

            customRender(<GeneExpressGrid />, {
                initialState,
            });
        });

        it('should display gOEnrichment data fetched via websocket, after gene is chosen', async () => {
            fireEvent.change(screen.getByPlaceholderText('Search for a gene'), {
                target: { value: genes[0].name.slice(0, 2) },
            });

            fireEvent.click(await screen.findByText(genes[0].name));

            // No other "React Testing Library" way to know that to determine that observer was
            // initialized. Half second is enough time to ensure that.
            setTimeout(() => {
                webSocketMock.send(
                    JSON.stringify({
                        item: {
                            ...generateData(1),
                            status: DONE_DATA_STATUS,
                            output: {
                                terms: 1,
                                species: genes[0].species,
                                source: genes[0].source,
                            },
                        },
                        msg: 'changed',
                        observer: observerId,
                        primary_key: 'id',
                    }),
                );
            }, 500);

            // Mocked WebSocket needs almost a second to establish connection, that's why
            // increased timeout is used.
            await waitFor(
                () => {
                    screen.getByText(gOEnrichmentJson.tree.BP[0].term_name);
                },
                { timeout: 1500 },
            );
        });
    });
});
