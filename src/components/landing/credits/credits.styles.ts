import styled from 'styled-components';
import { breakpoints } from '../../app/globalStyle';

// eslint-disable-next-line import/prefer-default-export
export const CreditsLogos = styled.div`
    width: 100%;
    display: flex;
    flex-flow: column nowrap;
    margin-top: 50px;

    & img {
        margin-bottom: 40px;
    }

    @media (min-width: ${breakpoints.small}px) {
        flex-flow: row wrap;
        justify-content: center;

        & img {
            margin-right: 35px;
            margin-left: 35px;
        }
    }
`;
