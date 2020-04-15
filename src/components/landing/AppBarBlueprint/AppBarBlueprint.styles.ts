import styled, { StyledFunction } from 'styled-components';
import { Button } from '@blueprintjs/core';
import { appBarHeight } from '../../App/globalStyle';

export const AppBarContainerBlueprint = styled.div`
    height: ${appBarHeight}px;
    position: fixed;
    top: ${appBarHeight * 3}px;
    right: 0;
    left: 0;
    background-color: #fff;
    z-index: 1030;
`;

export const NavButtonBlueprint = styled(Button)`
    &.bp3-active {
        background-color: #49688d !important;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.125) inset !important;
        color: #fff;
    }
`;

export const bla = styled.div``;
