import { generateTimeSeriesById, generateBasket, generateSingleTimeSeries } from 'tests/mock';
import { RelationsById, BasketInfo } from 'redux/models/internal';
import _ from 'lodash';
import { Relation } from '@genialis/resolwe/dist/api/types/rest';
import timeSeriesReducer, {
    timeSeriesSelected,
    TimeSeriesState,
    timeSeriesFetchSucceeded,
    addSamplesToBasketSucceeded,
} from './timeSeries';

describe('timeSeries store', () => {
    let timeSeriesById: RelationsById;
    let initialState: TimeSeriesState;

    beforeEach(() => {
        timeSeriesById = generateTimeSeriesById(2);
    });

    describe('empty initial state', () => {
        let timeSeries: Relation[];

        beforeEach(() => {
            timeSeries = _.flatMap(timeSeriesById);

            initialState = {
                byId: {},
                selectedId: 0,
                isFetching: false,
                isAddingToBasket: false,
                basketInfo: {} as BasketInfo,
            };
        });

        it('should add fetched timeSeries to state with timeSeriesFetchSucceeded action', () => {
            const newState = timeSeriesReducer(initialState, timeSeriesFetchSucceeded(timeSeries));
            const expectedState = {
                ...initialState,
                byId: timeSeriesById,
            };

            expect(newState).toEqual(expectedState);
        });

        it('should set selectedId with timeSeriesSelected action', () => {
            const newState = timeSeriesReducer(initialState, timeSeriesSelected(123));
            const expectedState = {
                ...initialState,
                selectedId: 123,
            };

            expect(newState).toEqual(expectedState);
        });

        it('should set basketInfo with addSamplesToBasketSucceeded action', () => {
            const basket = generateBasket('123');
            const newState = timeSeriesReducer(initialState, addSamplesToBasketSucceeded(basket));
            const expectedState = {
                ...initialState,
                basketInfo: {
                    id: basket.id,
                    source: basket.permitted_sources[0],
                    species: basket.permitted_organisms[0],
                    type: 'gene',
                },
            };

            expect(newState).toEqual(expectedState);
        });
    });

    describe('not empty initial state', () => {
        beforeEach(() => {
            initialState = {
                byId: timeSeriesById,
                selectedId: 0,
                isFetching: false,
                isAddingToBasket: false,
                basketInfo: {} as BasketInfo,
            };
        });

        it('should set fetched timeSeries to state with timeSeriesFetchSucceeded action', () => {
            const newRelation = generateSingleTimeSeries(2);
            const newState = timeSeriesReducer(
                initialState,
                timeSeriesFetchSucceeded([newRelation]),
            );
            const expectedState = {
                ...initialState,
                byId: { [newRelation.id]: newRelation },
            };

            expect(newState).toEqual(expectedState);
        });
    });
});
