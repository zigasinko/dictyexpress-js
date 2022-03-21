import React, { ReactNode, ReactElement, forwardRef } from 'react';
import { Tooltip } from '@material-ui/core';
import { StyledIconButton, StyledIconButtonProps } from './iconButtonWithTooltip.styles';
import useForwardedRef from '../useForwardedRef';

type IconButtonWithTooltipProps = {
    title: string;
    disabled?: boolean;
    children: ReactNode;
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
} & Pick<StyledIconButtonProps, '$disablePadding'>;

const IconButtonWithTooltip = forwardRef<HTMLButtonElement, IconButtonWithTooltipProps>(
    (
        { title, disabled, children, $disablePadding, onClick }: IconButtonWithTooltipProps,
        ref,
    ): ReactElement => {
        const forwardedRef = useForwardedRef<HTMLButtonElement>(ref);

        return (
            <Tooltip title={title}>
                <span>
                    <StyledIconButton
                        aria-label={title}
                        onClick={onClick}
                        disabled={disabled}
                        $disablePadding={$disablePadding}
                        ref={forwardedRef}
                    >
                        {children}
                    </StyledIconButton>
                </span>
            </Tooltip>
        );
    },
);

export default IconButtonWithTooltip;
