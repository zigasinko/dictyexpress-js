import styled from 'styled-components';
import { Button, AppBar, Toolbar } from '@material-ui/core';
import { breakpoints, appBarHeight } from '../../app/globalStyle';

export const AppBarWrapper = styled(AppBar)`
    background-color: #fff;
`;

export const ToolbarWrapper = styled(Toolbar)`
    height: ${appBarHeight}px;
    min-height: ${appBarHeight}px;
`;

export const ShortDescription = styled.div`
    margin-left: auto;
    color: #49688d;
    display: inline-flex;
    white-space: pre;
`;

export const NavButton = styled(Button)`
    text-transform: none;
    justify-content: flex-start;
`;

export const MobileSection = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;

    @media (min-width: ${breakpoints.small}px) {
        display: none;
    }
`;

export const DesktopSection = styled.div`
    display: none;
    @media (min-width: ${breakpoints.small}px) {
        display: flex;
        align-items: center;
        width: 100%;
    }
`;
