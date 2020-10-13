import styled, { FlattenSimpleInterpolation, css } from 'styled-components';
import { breakpoints } from 'components/app/globalStyle';
import { Toolbar } from '@material-ui/core';

export const MobileSection = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;

    @media (min-width: ${breakpoints.small}px) {
        display: none;
    }
`;

export type DesktopSectionProps = {
    alwaysVisible?: boolean;
};

export const DesktopSection = styled.div<DesktopSectionProps>`
    && {
        ${(props): FlattenSimpleInterpolation | null =>
            props.alwaysVisible
                ? css`
                      display: inline-flex;
                      align-items: center;
                      width: 100%;
                  `
                : css`
                      display: none;
                      @media (min-width: ${breakpoints.small}px) {
                          display: inline-flex;
                          align-items: center;
                          width: 100%;
                      }
                  `};
    }
`;

export const DictyToolbar = styled(Toolbar)`
    width: 100%;
`;
