import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { customRender } from 'tests/test-utils';
import { testState, mockStore, generateGenesById, generateVolcanoPoints } from 'tests/mock';
import { allGenesDeselected, genesSelected } from 'redux/stores/genes';
import { MockStoreEnhanced } from 'redux-mock-store';
import { RootState } from 'redux/rootReducer';
import { AppDispatch } from 'redux/appStore';
import VolcanoPointsSelectionModal from './volcanoPointsSelectionModal';

const volcanoPoints = generateVolcanoPoints(5);
const genesById = generateGenesById(5);

describe('no genes selected', () => {
    let mockedStore: MockStoreEnhanced<RootState, AppDispatch>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockedOnClose = jest.fn();

    beforeEach(() => {
        const initialTestState = testState();
        initialTestState.genes.byId = genesById;
        initialTestState.genes.selectedGenesIds = [];
        mockedStore = mockStore(initialTestState);
        mockedStore.clearActions();

        customRender(
            <VolcanoPointsSelectionModal
                volcanoPoints={volcanoPoints}
                differentialExpressionName="testDifferentialExpression"
                handleOnClose={mockedOnClose}
                open
                probFieldLabel="Prob field"
            />,
            {
                mockedStore,
            },
        );
    });

    it('should call onClose when user clicks close button', () => {
        // Simulate click on first gene set.
        fireEvent.click(screen.getByText('Close'));

        expect(mockedOnClose.mock.calls.length).toBe(1);
    });

    it('should display volcano points in a grid', () => {
        volcanoPoints.forEach((volcanoPoint) => {
            expect(screen.getByText(genesById[volcanoPoint.geneId].name));
        });

        expect(screen.getByText(`Select all ${volcanoPoints.length}`));
    });

    it('should dispatch genesSelected action after user selects volcano points anc clicks select', async () => {
        await waitFor(() =>
            fireEvent.click(screen.getByText(genesById[volcanoPoints[1].geneId].name)),
        );
        await waitFor(() =>
            fireEvent(
                screen.getByText(genesById[volcanoPoints[2].geneId].name),
                new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }),
            ),
        );

        await waitFor(() => expect(screen.getByText('Select')).toBeEnabled());
        fireEvent.click(screen.getByText('Select'));

        await waitFor(() => {
            expect(mockedStore.getActions()).toEqual([
                genesSelected([volcanoPoints[1].geneId, volcanoPoints[2].geneId]),
            ]);
        });
    });

    it('should first dispatch allGenesDeselected action and then should dispatch genesSelected action after user selects volcano points anc clicks select', async () => {
        await waitFor(() =>
            fireEvent.click(screen.getByText(genesById[volcanoPoints[1].geneId].name)),
        );
        await waitFor(() =>
            fireEvent(
                screen.getByText(genesById[volcanoPoints[2].geneId].name),
                new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }),
            ),
        );

        fireEvent.click(screen.getByText('Append selected genes to Genes module'));
        fireEvent.click(screen.getByText('Select'));

        await waitFor(() => {
            expect(mockedStore.getActions()).toEqual([
                allGenesDeselected(),
                genesSelected([volcanoPoints[1].geneId, volcanoPoints[2].geneId]),
            ]);
        });
    });

    it('should dispatch genesSelected with all genes ids after user clicks select all', () => {
        fireEvent.click(screen.getByText('Select all', { exact: false }));

        expect(mockedStore.getActions()).toEqual([
            genesSelected(volcanoPoints.map((volcanoPoint) => volcanoPoint.geneId)),
        ]);
    });

    it('should first dispatch allGenesDeselected action and then dispatch genesSelected with all genes ids after user clicks select all', async () => {
        fireEvent.click(screen.getByText('Append selected genes to Genes module'));
        fireEvent.click(screen.getByText('Select all', { exact: false }));

        // TODO: check if this await is necessary
        await waitFor(() => {
            expect(mockedStore.getActions()).toEqual([
                allGenesDeselected(),
                genesSelected(volcanoPoints.map((volcanoPoint) => volcanoPoint.geneId)),
            ]);
        });
    });
});
