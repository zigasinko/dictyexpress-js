import React from 'react';
import { screen } from '@testing-library/react';
import { testState } from 'tests/mock';
import { customRender } from 'tests/test-utils';
import _ from 'lodash';
import ConnectedTimeSeriesAndGeneSelector from './timeSeriesAndGeneSelector';

describe('timeSeriesAndGeneSelector', () => {
    it('should render timeSeriesAndGeneSelector', () => {
        const initialTestState = testState();
        customRender(<ConnectedTimeSeriesAndGeneSelector />, {
            initialState: initialTestState,
        });

        screen.getByText(_.flatMap(initialTestState.timeSeries.byId)[0].collection.name);
    });
});
