import styled from 'styled-components';
import dictyImage from '../../../images/dicty_image.png';

// eslint-disable-next-line import/prefer-default-export
export const HomeContainer = styled.div`
    background: url(${dictyImage}), linear-gradient(to right, #49688d, #7ca2cf);
    background-repeat: no-repeat;
    background-position: left bottom;
    padding-top: 110px;
    padding-bottom: 70px;
    width: 100%;
    position: relative;
`;
