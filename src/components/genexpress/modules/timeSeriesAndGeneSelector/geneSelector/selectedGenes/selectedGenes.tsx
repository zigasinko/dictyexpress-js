import React, { ReactElement } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import ClearIcon from '@material-ui/icons/Clear';
import { ContentCopy as ContentCopyIcon } from 'mdi-material-ui';
import { Gene } from '../../../../../../redux/models/internal';
import GeneChip from './geneChip/geneChip';

import {
    geneDeselected,
    geneHighlighted,
    geneUnhighlighted,
    allGenesDeselected,
} from '../../../../../../redux/stores/genes';
import IconButtonWithTooltip from '../../../../common/iconButtonWithTooltip/iconButtonWithTooltip';
import { setClipboardText } from '../../../../../../utils/documentHelpers';
import { SelectedGenesContainer, ActionsContainer } from './selectedGenes.styles';

const connector = connect(null, {
    connectedGeneDeselected: geneDeselected,
    connectedGeneHighlighted: geneHighlighted,
    connectedGeneUnhighlighted: geneUnhighlighted,
    connectedAllGenesDeselected: allGenesDeselected,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

type SelectedGenesProps = {
    selectedGenes: Gene[];
    highlightedGenesNames: string[];
} & PropsFromRedux;

const SelectedGenes = ({
    selectedGenes,
    highlightedGenesNames,
    connectedGeneDeselected,
    connectedGeneHighlighted,
    connectedGeneUnhighlighted,
    connectedAllGenesDeselected,
}: SelectedGenesProps): ReactElement => {
    const handleOnRemove = (gene: Gene): void => {
        connectedGeneDeselected(gene);
    };

    const handleOnHighlight = (gene: Gene): void => {
        connectedGeneHighlighted(gene);
    };

    const handleOnUnhighlight = (gene: Gene): void => {
        connectedGeneUnhighlighted(gene);
    };

    const handleCopyClick = (): void => {
        setClipboardText(selectedGenes.map((gene) => gene.name).join(', '));
    };

    const handleClearAllClick = (): void => {
        connectedAllGenesDeselected();
    };

    return (
        <>
            <SelectedGenesContainer>
                {selectedGenes.map((gene) => (
                    <GeneChip
                        key={gene.name}
                        gene={gene}
                        highlighted={highlightedGenesNames.includes(gene.name)}
                        onRemove={(): void => handleOnRemove(gene)}
                        onHighlight={(): void => handleOnHighlight(gene)}
                        onUnhighlight={(): void => handleOnUnhighlight(gene)}
                    />
                ))}
            </SelectedGenesContainer>
            <ActionsContainer>
                <IconButtonWithTooltip
                    title={`Copy ${selectedGenes.length} ${
                        selectedGenes.length === 1 ? 'gene' : 'genes'
                    } to clipboard`}
                    disabled={selectedGenes.length === 0}
                    onClick={handleCopyClick}
                >
                    <ContentCopyIcon />
                </IconButtonWithTooltip>
                <IconButtonWithTooltip
                    title="Clear all"
                    disabled={selectedGenes.length === 0}
                    onClick={handleClearAllClick}
                >
                    <ClearIcon />
                </IconButtonWithTooltip>
            </ActionsContainer>
        </>
    );
};

export default connector(SelectedGenes);
