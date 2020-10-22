import React, { ReactElement } from 'react';
import { formatNumber } from 'utils/math';
import withMuiStylesProvider from 'components/genexpress/common/dictyGrid/withMuiThemeProvider';
import { DataTypeProvider } from '@devexpress/dx-react-grid';
import {
    ScoreCellContainer,
    ScoreLabel,
    ScoreLinearProgress,
} from './gOEnrichmentScoreCellDevExpress.styles';

const GOEnrichmentScoreCell = ({
    value,
    row,
}: DataTypeProvider.ValueFormatterProps): ReactElement => {
    return (
        <ScoreCellContainer>
            <ScoreLinearProgress
                variant="determinate"
                value={row.score_percentage}
                color="secondary"
            />
            <ScoreLabel>{formatNumber(value, 'short')}</ScoreLabel>
        </ScoreCellContainer>
    );
};

export default withMuiStylesProvider(GOEnrichmentScoreCell);
