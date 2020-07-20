import styled from 'styled-components';
import { TextField } from '@material-ui/core';

// eslint-disable-next-line import/prefer-default-export
export const GridWrapper = styled.div`
    height: calc(100% - 260px);
`;

export const FilterTextField = styled(TextField)`
    margin-bottom: 5px;
`;
