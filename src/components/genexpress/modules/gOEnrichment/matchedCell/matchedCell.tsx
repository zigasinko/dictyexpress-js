import React, { ReactElement } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { GOEnrichmentRow } from 'redux/models/internal';
import { MatchedButton, MatchedCellContainer } from './matchedCell.styles';

const MatchedCell = ({
    value,
    data,
    onMatchedGenesClick,
}: Pick<ICellRendererParams, 'value' | 'data'> & {
    onMatchedGenesClick: (row: GOEnrichmentRow) => void;
}): ReactElement => (
    <MatchedCellContainer>
        <MatchedButton
            fullWidth
            color="secondary"
            onClick={(): void => {
                onMatchedGenesClick(data);
            }}
        >
            {`${value}/${data.total}`}
        </MatchedButton>
    </MatchedCellContainer>
);

export default MatchedCell;
