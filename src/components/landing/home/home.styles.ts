import styled from 'styled-components';
import { Button } from '@material-ui/core';
import dictyImage from '../../../images/dicty_image.png';
import { breakpoints } from '../../app/globalStyle';

export const HomeContainer = styled.div`
    background: url(${dictyImage}), linear-gradient(to right, #49688d, #7ca2cf);
    background-repeat: no-repeat;
    background-position: left bottom;
    padding-top: 110px;
    padding-bottom: 70px;
    width: 100%;
    position: relative;
    color: #fff;
`;

export const HomeWrapper = styled.div`
    width: 100%;
    display: flex;
    flex-flow: column nowrap;

    @media (min-width: ${breakpoints.small}px) {
        flex-flow: row wrap;
        justify-content: space-between;
    }
`;

export const HomeDescription = styled.div`
    width: 100%;

    & p {
        font-size: 1.75rem;
        line-height: 1.2em;
        margin-bottom: 50px;
    }

    @media (min-width: ${breakpoints.small}px) {
        width: 49%;
    }
`;

export const HomeDemo = styled.div`
    width: 100%;

    & > img {
        max-width: 100%;
        height: auto;
    }

    @media (min-width: ${breakpoints.small}px) {
        width: 49%;
    }
`;

export const HomeRunDictyButton = styled(Button)`
    color: #fff;
    border-color: #fff;
    background-color: #49688d;
    background-image: none;
    text-shadow: none;
    font-size: 30px;
    text-transform: none;

    & a {
        text-decoration: none;
        color: inherit;
    }
`;
