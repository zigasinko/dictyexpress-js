import React, { ReactElement } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { TermCellContainer, TermIndentationIcon } from './termCell.styles';

const TermCell = ({ data }: Pick<ICellRendererParams, 'data'>): ReactElement => (
    <TermCellContainer>
        {data.depth > 0 && <TermIndentationIcon depth={data.depth} />}
        <span>{data.term_name}</span>
    </TermCellContainer>
);

export default TermCell;
