import styled from 'styled-components';
import { appBarHeight } from '../../App/globalStyle';

// eslint-disable-next-line import/prefer-default-export
export const AppBarContainer = styled.div`
    height: ${appBarHeight}px;
    position: fixed;
    right: 0;
    left: 0;
    background-color: #fff;
    z-index: 1030;
`;

export const AppBarSpacer = styled.div`
    height: 50px;
`;

export const NavBar = styled.div`
    display: flex;
    height: 100%;
    width: 100%;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: left;
`;

export const ShortDescription = styled.div`
    margin-left: auto;
    color: #49688d;
    font-size: 16px;
`;
