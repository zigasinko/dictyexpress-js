import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { generateTimeSeriesById, mockStore, testState } from 'tests/mock';
import { customRender } from 'tests/test-utils';
import { MockStoreEnhanced } from 'redux-mock-store';
import { RootState } from 'redux/rootReducer';
import { AppDispatch } from 'redux/appStore';
import _ from 'lodash';
import { comparisonTimeSeriesChanged } from 'redux/stores/timeSeries';
import SelectComparisonTimeSeriesModal from './selectComparisonTimeSeriesModal';

const timeSeriesById = generateTimeSeriesById(3);
const timeSeries = _.flatMap(timeSeriesById);
const selectedTimeSeries = timeSeries[0];

describe('selectComparisonTimeSeriesModal', () => {
    let initialState: RootState;
    let mockedStore: MockStoreEnhanced<RootState, AppDispatch>;
    const mockedOnClose = jest.fn();

    beforeEach(() => {
        mockedOnClose.mockClear();

        initialState = testState();
        initialState.timeSeries.byId = timeSeriesById;
        initialState.timeSeries.selectedId = selectedTimeSeries.id;

        mockedStore = mockStore(initialState);
        mockedStore.clearActions();

        customRender(<SelectComparisonTimeSeriesModal handleOnClose={mockedOnClose} />, {
            mockedStore,
        });
    });

    it('should not display selected time series in a grid', () => {
        expect(
            screen.queryByRole('gridcell', {
                name: selectedTimeSeries.collection.name,
            }),
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole('gridcell', {
                name: timeSeries[1].collection.name,
            }),
        ).toBeInTheDocument();
    });

    it('should call comparisonTimeSeriesChanged with clicked timeSeries', async () => {
        fireEvent.click(
            screen.getByRole('gridcell', {
                name: timeSeries[1].collection.name,
            }),
        );

        await waitFor(() => {
            expect(mockedStore.getActions()).toEqual([
                comparisonTimeSeriesChanged([timeSeries[1].id]),
            ]);
        });
    });

    it('should call onClose when user clicks close button', () => {
        fireEvent.click(screen.getByText('Close'));

        expect(mockedOnClose.mock.calls.length).toBe(1);
    });
});
