import React, { ReactElement, useState } from 'react';
import Button from '@material-ui/core/Button';
import { ValueFormatterParams } from 'ag-grid-community';
import {
    ModalFooter,
    ModalBody,
    ModalHeader,
    ModalContainer,
    CenteredModal,
} from 'components/genexpress/common/dictyModal/dictyModal.styles';
import DictyGrid from 'components/genexpress/common/dictyGrid/dictyGrid';
import { GeneSet } from 'redux/models/internal';
import { ManageGeneSetsGridWrapper } from './manageGeneSetsModal.styles';

type ManageGeneSetsModalProps = {
    geneSets: GeneSet[];
    onDelete: (geneSets: GeneSet[]) => void;
    onClick: (geneSet: GeneSet) => void;
    onClose: () => void;
    open: boolean;
};

const ManageGeneSetsModal = ({
    open,
    geneSets,
    onDelete,
    onClick,
    onClose,
}: ManageGeneSetsModalProps): ReactElement => {
    const [selectedGeneSets, setSelectedGeneSets] = useState<GeneSet[]>([]);
    const geneSetsSelectionChangedHandler = (newSelectedGeneSets: GeneSet[]): void => {
        setSelectedGeneSets(newSelectedGeneSets);
    };

    const handleOnDelete = (): void => {
        onDelete(selectedGeneSets);
    };

    const handleOnClick = (geneSet: GeneSet): void => {
        onClick(geneSet);
    };

    return (
        <CenteredModal
            open={open}
            aria-labelledby="modalTitle"
            aria-describedby="modalDescription"
            onClose={onClose}
        >
            <ModalContainer>
                <ModalHeader id="modalTitle">Gene List History</ModalHeader>
                <ModalBody>
                    <div id="modalDescription">
                        Choose a gene set from a list of locally saved gene sets
                    </div>
                    <ManageGeneSetsGridWrapper>
                        <DictyGrid
                            data={geneSets}
                            getRowId={(data): string => data.dateTime.toString()}
                            columnDefs={[
                                {
                                    headerCheckboxSelection: true,
                                    checkboxSelection: true,
                                    width: 25,
                                },
                                {
                                    field: 'dateTime',
                                    headerName: 'Date',
                                    width: 90,
                                    sort: 'desc',
                                    valueFormatter: (params: ValueFormatterParams): string => {
                                        return params.value.toLocaleString('en-US');
                                    },
                                },
                                {
                                    field: 'genesNames',
                                    headerName: 'Genes',
                                    autoHeight: true,
                                    cellStyle: { 'white-space': 'normal' },
                                    valueFormatter: (params: ValueFormatterParams): string => {
                                        return params.value.join(', ');
                                    },
                                },
                            ]}
                            selectionMode="multiple"
                            onSelectionChanged={geneSetsSelectionChangedHandler}
                            onRowClicked={handleOnClick}
                            suppressRowClickSelection
                            hideFilter
                        />
                    </ManageGeneSetsGridWrapper>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={handleOnDelete} disabled={selectedGeneSets.length === 0}>
                        Delete selected
                    </Button>
                    <Button onClick={onClose}>Close</Button>
                </ModalFooter>
            </ModalContainer>
        </CenteredModal>
    );
};

export default ManageGeneSetsModal;
