import { Button } from '@material-ui/core';
import styled from 'styled-components';

export const MatchedCellContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-content: center;
    justify-content: center;
    position: relative;
    width: 100%;
    height: 100%;
`;

export const MatchedButton = styled(Button)`
    height: 26px;
    font-weight: bold;
`;
