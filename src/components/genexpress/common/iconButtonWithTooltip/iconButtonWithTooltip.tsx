import React, { ReactNode, ReactElement } from 'react';
import { Tooltip } from '@material-ui/core';
import { StyledIconButton, StyledIconButtonProps } from './iconButtonWithTooltip.styles';

type IconButtonWithTooltipProps = {
    title: string;
    disabled?: boolean;
    children: ReactNode;
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
} & Pick<StyledIconButtonProps, 'nopadding'>;

const IconButtonWithTooltip = ({
    title,
    disabled,
    children,
    nopadding,
    onClick,
}: IconButtonWithTooltipProps): ReactElement => {
    return (
        <Tooltip title={title}>
            <span>
                <StyledIconButton
                    aria-label={title}
                    onClick={onClick}
                    disabled={disabled}
                    nopadding={nopadding}
                >
                    {children}
                </StyledIconButton>
            </span>
        </Tooltip>
    );
};

export default IconButtonWithTooltip;
