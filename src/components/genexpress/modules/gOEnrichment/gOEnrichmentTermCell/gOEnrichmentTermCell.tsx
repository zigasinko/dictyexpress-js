import React, { ReactElement } from 'react';
import withMuiStylesProvider from 'components/genexpress/common/dictyGrid/withMuiThemeProvider';
import { AcUnit, ExpandLess, ExpandMore } from '@material-ui/icons';
import { ICellRendererParams } from 'ag-grid-community';
import _ from 'lodash';
import { GOEnrichmentRow } from 'redux/models/internal';
import {
    RowIndentation,
    TermCellContainer,
    ToggleRowIconButton,
} from './gOEnrichmentTermCell.styles';

const GOEnrichmentTermCell = ({
    data,
    onToggleClick,
}: ICellRendererParams & { onToggleClick: (row: GOEnrichmentRow) => void }): ReactElement => {
    const handleOnClick = (): void => {
        onToggleClick(data);
    };

    return (
        <TermCellContainer>
            <RowIndentation depth={data.depth}>
                <ToggleRowIconButton
                    aria-label="Toggle row"
                    onClick={handleOnClick}
                    disabled={data.children == null}
                >
                    {data.children == null && <AcUnit />}
                    {data.children?.length > 0 && <ExpandMore />}
                    {data.children?.length > 0 && data.isCollapsed && <ExpandLess />}
                </ToggleRowIconButton>
                <span>{data.term_name}</span>
            </RowIndentation>
        </TermCellContainer>
    );
};

export default withMuiStylesProvider(GOEnrichmentTermCell);
