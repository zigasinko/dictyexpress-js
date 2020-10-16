import { LinearProgress } from '@material-ui/core';
import styled from 'styled-components';

export const ScoreCellContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-content: center;
    justify-content: center;
    position: relative;
    width: 100%;
    height: 100%;
`;

export const ScoreLabel = styled.span`
    position: absolute;
    top: 0;
    font-weight: bold;
`;

export const ScoreLinearProgress = styled(LinearProgress)`
    && {
        width: 100%;
        height: 26px;
    }
`;
