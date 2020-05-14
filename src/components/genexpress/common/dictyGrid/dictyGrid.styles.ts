import styled from 'styled-components';
import { TextField } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';

// eslint-disable-next-line import/prefer-default-export
export const GridWrapper = styled.div`
    height: 100%;
    overflow: hidden;
`;

export const FilterTextField = styled(TextField)`
    margin-bottom: 5px;
`;

export const GridRowDeleteIcon = styled(DeleteIcon)`
    font-size: 24px;
    cursor: pointer;
`;
