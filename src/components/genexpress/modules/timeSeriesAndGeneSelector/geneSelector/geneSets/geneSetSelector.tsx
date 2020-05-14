import React, { ReactElement, useState } from 'react';
import { Button } from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';
import { GeneSet, Gene } from '../../../../../../redux/models/internal';
import ManageGeneSets from './manageGeneSets';
import useLocalStorage from '../../../../common/useLocalStorage';
import IconButtonWithTooltip from '../../../../common/iconButtonWithTooltip/iconButtonWithTooltip';
import { LocalStorageKey } from '../../../../common/constants';

type SelectGeneSetProps = {
    selectedGenes: Gene[];
    disabled?: boolean;
    onSelect: (genesNames: string[]) => void;
};

const GeneSetSelector = ({
    selectedGenes,
    disabled,
    onSelect,
}: SelectGeneSetProps): ReactElement => {
    // const [geneSets, setGeneSets] = useState<GeneSets>([]);
    const [manageGeneSetsModalOpened, setManageGeneSetsModalOpened] = useState(false);
    const [geneSets, setGeneSets] = useLocalStorage<GeneSet[]>(LocalStorageKey.GENE_LISTS, []);

    const addGeneSet = (): void => {
        // Save each change to local storage so user can pick a gene set from history.
        if (selectedGenes != null && selectedGenes.length > 0) {
            const newGeneSet = {
                dateTime: new Date(),
                genesNames: selectedGenes.map((gene) => gene.name),
            } as GeneSet;

            setGeneSets((prevGeneSets) => [...prevGeneSets, newGeneSet]);
        }
    };

    const handleOnClick = (geneSet: GeneSet): void => {
        setManageGeneSetsModalOpened(false);
        onSelect(geneSet.genesNames);
    };

    const handleOnDelete = (geneSetsToDelete: GeneSet[]): void => {
        const updatedGeneSets = geneSets.filter((geneSet) => !geneSetsToDelete.includes(geneSet));
        setGeneSets(updatedGeneSets);
    };

    return (
        <>
            <div>
                <IconButtonWithTooltip
                    title="Save current gene set to local storage"
                    disabled={selectedGenes.length === 0}
                    onClick={addGeneSet}
                >
                    <SaveIcon />
                </IconButtonWithTooltip>
                <Button
                    size="small"
                    onClick={(): void => setManageGeneSetsModalOpened(!manageGeneSetsModalOpened)}
                    disabled={disabled}
                >
                    History
                </Button>
            </div>

            <ManageGeneSets
                open={manageGeneSetsModalOpened}
                geneSets={geneSets}
                onClick={handleOnClick}
                onDelete={handleOnDelete}
                onClose={(): void => setManageGeneSetsModalOpened(false)}
            />
        </>
    );
};

export default GeneSetSelector;
