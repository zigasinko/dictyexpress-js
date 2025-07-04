import React from 'react';
import { customRender } from 'tests/test-utils';
import { fireEvent, screen } from '@testing-library/react';
import { generateGOEnrichmentRow } from 'tests/mock';
import { GOEnrichmentRow } from 'redux/models/internal';
import GOEnrichmentMatchedCell from './matchedCell';

describe('gOEnrichmentMatchedCell', () => {
    let goEnrichmentRow: GOEnrichmentRow;
    let asFragment: () => DocumentFragment;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockedOnMatchedGenesClick: jest.Mock<any, any>;
    const value = 12;

    beforeEach(() => {
        mockedOnMatchedGenesClick = jest.fn();
        goEnrichmentRow = generateGOEnrichmentRow(1);

        ({ asFragment } = customRender(
            <GOEnrichmentMatchedCell
                value={value}
                data={goEnrichmentRow}
                onMatchedGenesClick={mockedOnMatchedGenesClick}
            />,
        ));
    });

    it('should render as default snapshot', () => {
        expect(asFragment()).toMatchSnapshot();
    });

    it('should call onMatchedGenesClick when user clicks on the link', () => {
        fireEvent.click(screen.getByText(`${value}/${goEnrichmentRow.total}`));

        expect(mockedOnMatchedGenesClick.mock.calls.length).toBe(1);
        expect(mockedOnMatchedGenesClick.mock.calls[0][0]).toBe(goEnrichmentRow);
    });
});
