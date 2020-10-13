import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { generateTimeSeriesById } from 'tests/mock';
import { getTimeSeries } from 'redux/stores/timeSeries';
import { BasketInfo } from 'redux/models/internal';
import { customRender } from 'tests/test-utils';
import DictyGrid from './dictyGrid';

const timeSeriesById = generateTimeSeriesById(2);
const timeSeries = getTimeSeries({
    byId: timeSeriesById,
    isFetching: false,
    selectedId: 1,
    isAddingToBasket: false,
    basketInfo: {} as BasketInfo,
});

describe('dictyGrid', () => {
    let container: HTMLElement;
    beforeEach(() => {
        ({ container } = customRender(
            <DictyGrid
                data={timeSeries}
                columnDefs={[
                    { field: 'id', headerName: 'Id', width: 20 },
                    { field: 'collection.name', headerName: 'Name', width: 50 },
                ]}
                getRowId={(data): string => data.id.toString()}
                filterLabel="Filter"
                selectedData={[timeSeries[0]]}
            />,
        ));
    });

    it('should display results', () => {
        // All timeSeries are displayed in ag-grid.
        timeSeries.forEach((ts) => expect(screen.getByText(ts.collection.name)));
    });

    it('should filter results', () => {
        // Simulate filter change.
        fireEvent.change(screen.getByLabelText('Filter'), {
            target: { value: timeSeries[1].collection.name },
        });

        // Check if results are filtered (first time series isn't shown).
        expect(screen.queryByText(timeSeries[0].collection.name)).toBeNull();
    });

    it('should mark already selected', async () => {
        await waitFor(() => {
            expect(container.querySelector("div[role='row'].ag-row-selected")).toBeInTheDocument();
        });
    });
});
