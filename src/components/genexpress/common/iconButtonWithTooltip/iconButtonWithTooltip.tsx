import React, { ReactNode, ReactElement } from 'react';
import { Tooltip, IconButton } from '@material-ui/core';

type IconButtonProps = {
    title: string;
    disabled?: boolean;
    children: ReactNode;
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

const IconButtonWithTooltip = ({
    title,
    disabled,
    children,
    onClick,
}: IconButtonProps): ReactElement => {
    return (
        <Tooltip title={title}>
            <span>
                <IconButton onClick={onClick} disabled={disabled}>
                    {children}
                </IconButton>
            </span>
        </Tooltip>
    );
};

export default IconButtonWithTooltip;
