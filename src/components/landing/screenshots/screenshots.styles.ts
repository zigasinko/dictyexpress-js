import styled, { css, FlattenSimpleInterpolation } from 'styled-components';
import Slider from 'react-slick';
import { breakpoints } from 'components/app/globalStyle';
// eslint-disable-next-line import/no-cycle
import { SliderArrowProps } from './screenshots';

export const SliderContainer = styled(Slider)`
    width: 90%;

    @media (min-width: ${breakpoints.small}px) {
        width: 80%;
    }

    @media (min-width: ${breakpoints.mid}px) {
        width: 60%;
    }
`;

export const Arrow = styled.span<SliderArrowProps>`
    font-size: 3em;
    color: #404040;
    cursor: pointer;

    position: absolute;
    top: calc(50% - 24px);

    ${(props): FlattenSimpleInterpolation =>
        props.type === 'next'
            ? css`
                  right: -48px;
              `
            : css`
                  left: -48px;
              `};

    &:hover {
        color: #929292;
    }
`;

export const Screenshot = styled.img`
    max-width: 100%;
    max-height: 50vh;
    margin: 0 auto 10px auto;
`;
