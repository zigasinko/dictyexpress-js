import React from 'react';
import { customRender } from 'tests/test-utils';
import { generateGOEnrichmentRow } from 'tests/mock';
import { GOEnrichmentRow } from 'redux/models/internal';
import GOEnrichmentTermCell from './termCell';

describe('gOEnrichmentTermCell', () => {
    let goEnrichmentRow: GOEnrichmentRow;
    let asFragment: () => DocumentFragment;

    beforeEach(() => {
        goEnrichmentRow = generateGOEnrichmentRow(1);
        goEnrichmentRow.term_name = 'Test term';
        goEnrichmentRow.depth = 3;

        ({ asFragment } = customRender(<GOEnrichmentTermCell data={goEnrichmentRow} />));
    });

    it('should render as default snapshot', () => {
        expect(asFragment()).toMatchSnapshot();
    });
});
