import React, { ReactNode, ReactElement } from 'react';
import { Tooltip } from '@material-ui/core';
import { StyledIconButton, StyledIconButtonProps } from './iconButtonWithTooltip.styles';

type IconButtonWithTooltipProps = {
    title: string;
    disabled?: boolean;
    children: ReactNode;
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
} & Pick<StyledIconButtonProps, 'noPadding'>;

const IconButtonWithTooltip = ({
    title,
    disabled,
    children,
    noPadding,
    onClick,
}: IconButtonWithTooltipProps): ReactElement => {
    return (
        <Tooltip title={title}>
            <span>
                <StyledIconButton onClick={onClick} disabled={disabled} noPadding={noPadding}>
                    {children}
                </StyledIconButton>
            </span>
        </Tooltip>
    );
};

export default IconButtonWithTooltip;
