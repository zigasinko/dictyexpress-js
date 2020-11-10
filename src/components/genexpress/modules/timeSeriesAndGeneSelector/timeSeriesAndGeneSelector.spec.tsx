import React from 'react';
import { screen } from '@testing-library/react';
import { testState } from 'tests/mock';
import { customRender, validateExportFile } from 'tests/test-utils';
import _ from 'lodash';
import { RootState } from 'redux/rootReducer';
import { getSelectedTimeSeries } from 'redux/stores/timeSeries';
import ConnectedTimeSeriesAndGeneSelector from './timeSeriesAndGeneSelector';

describe('timeSeriesAndGeneSelector', () => {
    let initialState: RootState;

    beforeEach(() => {
        initialState = testState();
        customRender(<ConnectedTimeSeriesAndGeneSelector />, {
            initialState,
        });
    });

    it('should render timeSeriesAndGeneSelector', () => {
        screen.getByText(_.flatMap(initialState.timeSeries.byId)[0].collection.name);
    });

    it('should export Collection/selectedCollection.tsv file', async () => {
        const selectedCollection = getSelectedTimeSeries(initialState.timeSeries);
        await validateExportFile('Collection/selectedCollection.tsv', (exportFile) => {
            expect(exportFile?.content).toContain(selectedCollection.collection.name);
        });
    });
});
