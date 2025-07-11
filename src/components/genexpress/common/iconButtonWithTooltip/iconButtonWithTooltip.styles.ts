import styled, { css, FlattenSimpleInterpolation } from 'styled-components';
import { IconButton } from '@mui/material';

export type StyledIconButtonProps = {
    $disablePadding?: boolean;
};

export const StyledIconButton = styled(IconButton)<StyledIconButtonProps>`
    && {
        ${(props): FlattenSimpleInterpolation | null =>
            props.$disablePadding
                ? css`
                      padding: 0;
                  `
                : null};
    }
`;
