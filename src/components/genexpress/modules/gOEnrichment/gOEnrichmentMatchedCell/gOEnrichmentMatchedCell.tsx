import React, { ReactElement } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import withMuiStylesProvider from 'components/genexpress/common/dictyGrid/withMuiThemeProvider';
import { GOEnrichmentRow } from 'redux/models/internal';
import { IconButton } from '@material-ui/core';
import { MatchedButton, MatchedCellContainer } from './gOEnrichmentMatchedCell.styles';

const GOEnrichmentScoreCell = ({
    value,
    data,
    onMatchedGenesClick,
}: ICellRendererParams & { onMatchedGenesClick: (row: GOEnrichmentRow) => void }): ReactElement => {
    const handleOnClick = (): void => {
        onMatchedGenesClick(data);
    };

    return (
        <>
            <MatchedCellContainer>
                <MatchedButton fullWidth type="button" color="secondary" onClick={handleOnClick}>
                    {`${value}/${data.total}`}
                </MatchedButton>
            </MatchedCellContainer>
            {/* IconButton has css selector specificity bug, that's why it must be included here
                so that styles injected by ag-grid don't override default material-ui ones. */}
            <IconButton />
        </>
    );
};

export default withMuiStylesProvider(GOEnrichmentScoreCell);
