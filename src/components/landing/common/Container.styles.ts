import styled from 'styled-components';
import { breakpoints } from '../../App/globalStyle';

const Container = styled.div`
    margin-right: auto;
    margin-left: auto;
    height: 100%;

    @media (min-width: ${breakpoints.small}px) {
        width: 750px;
    }
    @media (min-width: ${breakpoints.mid}px) {
        width: 970px;
    }
    @media (min-width: ${breakpoints.big}px) {
        width: 1170px;
    }
`;

export default Container;
