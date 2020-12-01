import styled from 'styled-components';
import { TextField } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';

export const DictyGridContainer = styled.div`
    height: 100%;
    display: flex;
    flex-flow: column nowrap;
`;

export const GridWrapper = styled.div`
    height: 100%;
    overflow: hidden;
    flex-grow: 1;
`;

export const FilterTextField = styled(TextField)`
    margin-bottom: 5px;
`;

export const GridRowDeleteIcon = styled(DeleteIcon)`
    font-size: 24px;
    cursor: pointer;
`;
