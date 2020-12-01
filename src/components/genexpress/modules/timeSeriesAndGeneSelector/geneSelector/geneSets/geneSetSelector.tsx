import React, { ReactElement, useState } from 'react';
import { Button } from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';
import { GeneSet, Gene } from 'redux/models/internal';
import { LocalStorageKey } from 'components/genexpress/common/constants';
import useLocalStorage from 'components/genexpress/common/useLocalStorage';
import IconButtonWithTooltip from 'components/genexpress/common/iconButtonWithTooltip/iconButtonWithTooltip';
import ManageGeneSetsModal from './manageGeneSetsModal';

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
    const [manageModalOpened, setManageModalOpened] = useState(false);
    const [geneSets, setGeneSets] = useLocalStorage<GeneSet[]>(LocalStorageKey.GENE_LISTS, []);

    /**
     * Saves gene set to local storage so user can later use it from history.
     */
    const addGeneSet = (): void => {
        if (selectedGenes != null && selectedGenes.length > 0) {
            const newGeneSet = {
                dateTime: new Date(),
                genesNames: selectedGenes.map((gene) => gene.name),
            } as GeneSet;

            setGeneSets((prevGeneSets) => [...prevGeneSets, newGeneSet]);
        }
    };

    const handleOnClick = (geneSet: GeneSet): void => {
        setManageModalOpened(false);
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
                    onClick={(): void => setManageModalOpened(true)}
                    disabled={disabled}
                >
                    History
                </Button>
            </div>

            {manageModalOpened && (
                <ManageGeneSetsModal
                    open={manageModalOpened}
                    geneSets={geneSets}
                    onClick={handleOnClick}
                    onDelete={handleOnDelete}
                    onClose={(): void => setManageModalOpened(false)}
                />
            )}
        </>
    );
};

export default GeneSetSelector;
