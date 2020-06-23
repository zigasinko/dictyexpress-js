import { MockStoreEnhanced } from 'redux-mock-store';
import {
    timeSeriesFetchStarted,
    timeSeriesFetchSucceeded,
    timeSeriesFetchEnded,
    addToBasketStarted,
    timeSeriesSelected,
    addSamplesToBasketSucceeded,
    addToBasketEnded,
} from 'redux/stores/timeSeries';
import {
    samplesExpressionsFetchSucceeded,
    samplesExpressionsFetchEnded,
    samplesExpressionsFetchStarted,
} from 'redux/stores/samplesExpressions';
import {
    testState,
    generateTimeSeriesById,
    generateSamplesExpressionsById,
    generateBasket,
    mockStore,
    DispatchExts,
} from '../../tests/mock';
import { RootState } from '../rootReducer';
import {
    fetchTimeSeries,
    fetchTimeSeriesSamplesExpressions,
    selectTimeSeries,
} from './timeSeriesThunks';

const initialTestState = testState();

describe('timeSeries thunk actions', () => {
    let store: MockStoreEnhanced<RootState, DispatchExts>;

    beforeEach(() => {
        store = mockStore(initialTestState);
        store.clearActions();
    });

    it('should dispatch timeSeriesFetchStarted, timeSeriesFetchSucceeded and timeSeriesFetchEnded action after fetchTimeSeries action is called', () => {
        const timeSeriesById = generateTimeSeriesById(2);

        const timeSeries = Object.keys(timeSeriesById).map(
            (timeSeriesId) => timeSeriesById[timeSeriesId],
        );
        fetchMock.mockResponse(JSON.stringify(timeSeries));

        return store.dispatch(fetchTimeSeries()).then(() => {
            // Check if correct action was called.
            expect(store.getActions()).toEqual([
                timeSeriesFetchStarted(),
                timeSeriesFetchSucceeded(timeSeries),
                timeSeriesFetchEnded(),
            ]);
        });
    });

    it('should dispatch samplesExpressionsFetchStarted, samplesExpressionsFetchSucceeded and samplesExpressionsFetchEnded after fetchTimeSeriesSamplesExpressions action is called', () => {
        const sampleExpressionsById = generateSamplesExpressionsById(1);
        const sampleExpressionId = Object.keys(sampleExpressionsById)[0];
        const sampleExpression = sampleExpressionsById[parseInt(sampleExpressionId, 10)];

        // Initialize store with
        fetchMock.mockResponse((req) => {
            if (req.url.includes('data')) {
                return Promise.resolve(
                    JSON.stringify([
                        {
                            id: 1,
                            output: {
                                exp_json: 123,
                            },
                            entity: {
                                id: sampleExpressionId,
                            },
                        },
                    ]),
                );
            }
            if (req.url.includes('storage')) {
                return Promise.resolve(
                    JSON.stringify({
                        json: {
                            genes: {
                                ...sampleExpression,
                            },
                        },
                    }),
                );
            }

            return Promise.reject(new Error('bad url'));
        });

        return store.dispatch(fetchTimeSeriesSamplesExpressions()).then(() => {
            // Check if correct action was called.
            expect(store.getActions()).toEqual([
                samplesExpressionsFetchStarted(),
                samplesExpressionsFetchSucceeded({ [sampleExpressionId]: sampleExpression }),
                samplesExpressionsFetchEnded(),
            ]);
        });
    });

    it('should dispatch addToBasketStarted, timeSeriesSelected, addSamplesToBasketSucceeded, fetchTimeSeriesSamplesExpressions and addToBasketEnded actions after selectTimeSeries action is called', () => {
        const basket = generateBasket('123');

        // Initialize store with
        fetchMock.mockResponse((req) => {
            if (req.url.includes('basket')) {
                return Promise.resolve(JSON.stringify(basket));
            }

            return Promise.reject(new Error('bad url'));
        });

        return store
            .dispatch(selectTimeSeries(initialTestState.timeSeries.selectedId ?? 0))
            .then(() => {
                /* Check if correct action was called.
                 *  samplesExpressionsFetchStarted() action is used instead of fetchTimeSeriesSamplesExpressions()
                 *  because redux-mock-store doesn't save dispatched thunk actions, only redux actions.
                 */
                expect(store.getActions()).toEqual([
                    addToBasketStarted(),
                    timeSeriesSelected(initialTestState.timeSeries.selectedId ?? 0),
                    addSamplesToBasketSucceeded(basket),
                    samplesExpressionsFetchStarted(),
                    addToBasketEnded(),
                ]);
            });
    });
});
