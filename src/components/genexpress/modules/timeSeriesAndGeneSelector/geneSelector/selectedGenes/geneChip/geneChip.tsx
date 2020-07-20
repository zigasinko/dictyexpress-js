import React, { ReactElement, useRef, useState } from 'react';
import Popper from '@material-ui/core/Popper';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import { Gene } from '../../../../../../../redux/models/internal';
import GeneInformation from '../geneInformation/geneInformation';
import { GeneChipWrapper } from './geneChip.styles';

export interface GeneChipProps {
    gene: Gene;
    highlighted: boolean;
    onHighlight: () => void;
    onUnhighlight: () => void;
    onRemove: () => void;
}
const GeneChip = ({
    gene,
    onRemove,
    highlighted,
    onHighlight,
    onUnhighlight,
}: GeneChipProps): ReactElement => {
    const [infoPopperOpen, setInfoPopperOpen] = useState(false);
    const chipWrapperElement = useRef<HTMLDivElement>(null);

    const handleClickAway = (): void => {
        setInfoPopperOpen(false);
    };

    const handleOnClick = (): void => {
        setInfoPopperOpen((prev) => !prev);
    };

    return (
        <ClickAwayListener onClickAway={handleClickAway}>
            <div>
                <GeneChipWrapper
                    label={gene.name}
                    onDelete={onRemove}
                    ref={chipWrapperElement}
                    onClick={handleOnClick}
                    size="small"
                    color={highlighted ? 'secondary' : 'default'}
                />

                <Popper anchorEl={chipWrapperElement.current} open={infoPopperOpen}>
                    <GeneInformation
                        gene={gene}
                        highlighted={highlighted}
                        onHighlight={onHighlight}
                        onUnhighlight={onUnhighlight}
                    />
                </Popper>
            </div>
        </ClickAwayListener>
    );
};

export default GeneChip;
