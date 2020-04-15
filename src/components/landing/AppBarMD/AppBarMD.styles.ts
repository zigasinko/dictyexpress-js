import styled, { StyledFunction } from 'styled-components';
import { Button, ButtonTypeMap } from '@material-ui/core';
import { NavHashLinkProps } from 'react-router-hash-link';
import { appBarHeight } from '../../App/globalStyle';

export const AppBarContainerMD = styled.div`
    height: ${appBarHeight}px;
    position: fixed;
    top: ${appBarHeight * 2}px;
    right: 0;
    left: 0;
    background-color: #fff;
    z-index: 1030;
`;

export const NavButtonMD = styled(Button)<NavHashLinkProps>`
    &.selected {
        background-color: #49688d !important;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.125) inset !important;
        color: #fff;
    }
`;

export const bla = styled.div``;
