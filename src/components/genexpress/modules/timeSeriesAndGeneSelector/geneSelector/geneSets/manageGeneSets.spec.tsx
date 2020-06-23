import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { generateGeneSets } from 'tests/mock';
import { customRender } from 'tests/test-utils';
import ManageGeneSets from './manageGeneSets';

// GeneSets have to be sorted so that first element in array is also first row in grid.
// Needed to assert selected item with 'Toggle Row Selection' (first row).
const testGeneSets = generateGeneSets(5).sort(
    (a, b) => b.dateTime.getTime() - a.dateTime.getTime(),
);

describe('manageGeneSets', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockedOnDelete: jest.Mock<any, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockedOnClick: jest.Mock<any, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockedOnClose: jest.Mock<any, any>;

    beforeEach(() => {
        mockedOnDelete = jest.fn();
        mockedOnClick = jest.fn();
        mockedOnClose = jest.fn();

        customRender(
            <ManageGeneSets
                geneSets={testGeneSets}
                onDelete={mockedOnDelete}
                onClick={mockedOnClick}
                onClose={mockedOnClose}
                open
            />,
        );
    });

    it('should render all gene sets in a grid', () => {
        testGeneSets.forEach((testGeneSet) => {
            expect(screen.getByText(testGeneSet.genesNames[0], { exact: false }));
        });
    });

    it('should call onDelete with selected gene sets', async () => {
        // Simulate select first row (gene set).
        fireEvent.click(screen.getAllByLabelText('Toggle Row Selection')[0]);
        fireEvent.click(await screen.findByText('Delete selected'));

        expect(mockedOnDelete.mock.calls.length).toBe(1);
        expect(mockedOnDelete.mock.calls[0][0]).toEqual([testGeneSets[0]]);
    });

    it('should call onClick with clicked gene set', async () => {
        // Simulate click on first gene set.
        fireEvent.click(screen.getByText(testGeneSets[0].genesNames.join(', ')));

        // Grid function 'onRowClicked' is async, that's why we must wait for it to execute.
        await waitFor(() => {
            expect(mockedOnClick.mock.calls.length).toBe(1);
        });
        expect(mockedOnClick.mock.calls[0][0]).toEqual(testGeneSets[0]);
    });

    it('should call onClose when user clicks close button', () => {
        // Simulate click on first gene set.
        fireEvent.click(screen.getByText('Close'));

        expect(mockedOnClose.mock.calls.length).toBe(1);
    });
});
