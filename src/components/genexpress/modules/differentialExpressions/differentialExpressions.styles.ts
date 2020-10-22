import styled from 'styled-components';
import { FormControl } from '@material-ui/core';

export const DifferentialExpressionsContainer = styled.div`
    display: flex;
    flex-flow: column nowrap;
    height: 100%;
`;

export const DifferentialExpressionsControls = styled.div`
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
`;

export const DifferentialExpressionsSelectWrapper = styled(FormControl)`
    min-width: 200px;
`;

export const ThresholdFormControlsContainer = styled.div`
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: flex-start;
    flex-grow: 1;
`;

export const ThresholdFormControl = styled(FormControl)`
    width: 115px;
    margin: 0 10px;
`;

export const VolcanoPlotContainer = styled.div`
    flex-grow: 1;
    overflow: hidden;
`;
