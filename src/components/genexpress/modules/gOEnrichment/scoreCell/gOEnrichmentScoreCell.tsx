import React, { ReactElement } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { formatNumber } from 'utils/math';
import withMuiStylesProvider from 'components/genexpress/common/dictyGrid/withMuiThemeProvider';
import {
    ScoreCellContainer,
    ScoreLabel,
    ScoreLinearProgress,
} from './gOEnrichmentScoreCell.styles';

const GOEnrichmentScoreCell = ({ value, data }: ICellRendererParams): ReactElement => {
    return (
        <ScoreCellContainer>
            <ScoreLinearProgress
                variant="determinate"
                value={data.score_percentage}
                color="secondary"
            />
            <ScoreLabel>{formatNumber(value, 'short')}</ScoreLabel>
        </ScoreCellContainer>
    );
};

export default withMuiStylesProvider(GOEnrichmentScoreCell);
