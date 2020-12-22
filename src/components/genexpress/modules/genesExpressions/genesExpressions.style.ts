import { Button } from '@material-ui/core';
import styled from 'styled-components';

export const GenesExpressionsContainer = styled.div`
    display: flex;
    flex-flow: column nowrap;
    height: 100%;
`;

export const GenesExpressionsLineChartContainer = styled.div`
    flex-grow: 1;
    overflow: hidden;
`;

export const FindSimilarGenesButton = styled(Button)`
    align-self: flex-start;
`;
