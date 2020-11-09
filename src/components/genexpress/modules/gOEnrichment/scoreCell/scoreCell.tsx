import React, { ReactElement } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { formatNumber } from 'utils/math';
import { ScoreCellContainer, ScoreSpan, ScoreLinearProgress } from './scoreCell.styles';

const ScoreCell = ({ value, data }: Pick<ICellRendererParams, 'value' | 'data'>): ReactElement => {
    return (
        <ScoreCellContainer>
            <ScoreLinearProgress
                variant="determinate"
                value={data.score_percentage}
                color="secondary"
            />
            <ScoreSpan>{formatNumber(value, 'short')}</ScoreSpan>
        </ScoreCellContainer>
    );
};

export default ScoreCell;
