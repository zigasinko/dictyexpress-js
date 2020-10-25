import { IconButton } from '@material-ui/core';
import styled from 'styled-components';

export const TermCellContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-content: center;
    justify-content: flex-start;
    position: relative;
    width: 100%;
    height: 100%;
`;

export const RowIndentation = styled.div<{ depth: number }>`
    margin-left: ${(props): string => (props.depth * 25).toString()}px;
`;

export const ToggleRowIconButton = styled(IconButton)`
    padding: 0;
`;
