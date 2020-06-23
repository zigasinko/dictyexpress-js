import styled, { css, FlattenSimpleInterpolation } from 'styled-components';
import { IconButton } from '@material-ui/core';

export type StyledIconButtonProps = {
    nopadding?: boolean;
};

// eslint-disable-next-line import/prefer-default-export
export const StyledIconButton = styled(IconButton)<StyledIconButtonProps>`
    && {
        ${(props): FlattenSimpleInterpolation | null =>
            props.nopadding
                ? css`
                      padding: 0;
                  `
                : null};
    }
`;
