import React, { ReactElement, useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';
import {
    ModalFooter,
    ModalBody,
    ModalHeader,
    ModalContainer,
    CenteredModal,
} from 'components/genexpress/common/dictyModal/dictyModal.styles';
import DictyGrid from 'components/genexpress/common/dictyGrid/dictyGrid';
import { Gene, GenesById, GOEnrichmentRow } from 'redux/models/internal';
import { connect, ConnectedProps } from 'react-redux';
import amigoLogo from 'images/amigo_logo.png';
import {
    genesSelected,
    getGenesById,
    getIsFetchingAssociationsGenes,
    getSelectedGenesIds,
} from 'redux/stores/genes';
import { RootState } from 'redux/rootReducer';
import { ValueGetterParams } from 'ag-grid-community';
import { fetchAssociationsGenes } from 'redux/epics/epicsActions';
import { Tooltip } from '@material-ui/core';
import _ from 'lodash';
import {
    TermInfo,
    AssociationsGridWrapper,
    GOEnrichmentFooterControlsContainer,
    AmigoLink,
} from './gOEnrichmentAssociations.style';

const mapStateToProps = (
    state: RootState,
): {
    genesById: GenesById;
    selectedGenesIds: string[];
    isFetchingAssociationsGenes: boolean;
} => {
    return {
        // Genes to be visualized.
        genesById: getGenesById(state.genes),
        selectedGenesIds: getSelectedGenesIds(state.genes),
        isFetchingAssociationsGenes: getIsFetchingAssociationsGenes(state.genes),
    };
};

const connector = connect(mapStateToProps, {
    connectedGenesSelected: genesSelected,
    connectedFetchAssociationsGenes: fetchAssociationsGenes,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

type GOEnrichmentAssociationsModalProps = {
    gOEnrichmentRow: GOEnrichmentRow;
    handleOnClose: () => void;
} & PropsFromRedux;

const GOEnrichmentAssociationsModal = ({
    gOEnrichmentRow,
    genesById,
    selectedGenesIds,
    handleOnClose,
    connectedGenesSelected,
    connectedFetchAssociationsGenes,
    isFetchingAssociationsGenes,
}: GOEnrichmentAssociationsModalProps): ReactElement => {
    const [associatedGenes, setAssociatedGenes] = useState<Gene[]>([]);
    const [selectedAssociatedGenes, setSelectedAssociatedGenes] = useState<Gene[]>([]);

    // When modal opens, fetch all genes that are associated with clicked gene ontology enrichment row.
    useEffect(() => {
        connectedFetchAssociationsGenes({
            geneIds: gOEnrichmentRow.gene_associations,
            species: gOEnrichmentRow.species,
        });
    }, [
        connectedFetchAssociationsGenes,
        gOEnrichmentRow.gene_associations,
        gOEnrichmentRow.species,
    ]);

    // Prepare data -> attach Gene to each volcano point.
    useEffect(() => {
        setAssociatedGenes(
            gOEnrichmentRow.gene_associations.flatMap(
                (associatedGeneId) => genesById[associatedGeneId] ?? [],
            ),
        );
    }, [gOEnrichmentRow, genesById]);

    // Propagate already selected genes to selected volcano points.
    useEffect(() => {
        setSelectedAssociatedGenes(
            associatedGenes.filter((gene) => selectedGenesIds.includes(gene.feature_id)),
        );
    }, [associatedGenes, selectedGenesIds]);

    const handleSelectOnClick = (): void => {
        connectedGenesSelected(selectedAssociatedGenes.map((gene) => gene.feature_id));
    };

    const handleSelectAllOnClick = (): void => {
        connectedGenesSelected(associatedGenes.map((gene) => gene.feature_id));
    };

    return (
        <CenteredModal
            open
            aria-labelledby="modalTitle"
            aria-describedby="modalDescription"
            onClose={handleOnClose}
        >
            <ModalContainer>
                <ModalHeader id="modalTitle">GO Term Association</ModalHeader>
                <ModalBody>
                    <TermInfo id="modalDescription">
                        <span>{_.capitalize(gOEnrichmentRow.term_name)}</span>
                        <Tooltip title="Open in AmiGO">
                            <AmigoLink
                                href={`http://amigo.geneontology.org/amigo/term/${gOEnrichmentRow.term_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="amigo-link"
                            >
                                {gOEnrichmentRow.term_id}
                                <img src={amigoLogo} alt="AmiGO link" />
                            </AmigoLink>
                        </Tooltip>
                    </TermInfo>
                    <p>
                        {gOEnrichmentRow.total > 1
                            ? `1 gene is associated with ${gOEnrichmentRow.term_id} term`
                            : `${gOEnrichmentRow.total} genes are associated with ${gOEnrichmentRow.term_id} term`}
                    </p>
                    <AssociationsGridWrapper>
                        {associatedGenes.length > 0 && (
                            <DictyGrid
                                isFetching={isFetchingAssociationsGenes}
                                data={associatedGenes}
                                getRowId={(data): string => data.feature_id}
                                filterLabel="Filter"
                                selectedData={selectedAssociatedGenes}
                                columnDefs={[
                                    {
                                        headerCheckboxSelection: true,
                                        checkboxSelection: true,
                                        width: 25,
                                    },
                                    {
                                        valueGetter: (params: ValueGetterParams): string => {
                                            return params.data.name;
                                        },
                                        headerName: 'Gene symbol',
                                        sort: 'asc',
                                        width: 150,
                                    },
                                    {
                                        valueGetter: (params: ValueGetterParams): string => {
                                            return params.data.full_name;
                                        },
                                        headerName: 'Gene Full Name',
                                        flex: 1,
                                    },
                                ]}
                                selectionMode="multiple"
                                onSelectionChanged={setSelectedAssociatedGenes}
                            />
                        )}
                    </AssociationsGridWrapper>
                </ModalBody>
                <ModalFooter>
                    <GOEnrichmentFooterControlsContainer>
                        <Button
                            onClick={handleSelectOnClick}
                            disabled={selectedAssociatedGenes.length === 0}
                        >
                            Select
                        </Button>
                        <Button
                            onClick={handleSelectAllOnClick}
                            disabled={selectedAssociatedGenes.length === 0}
                        >
                            Select all {associatedGenes.length}
                        </Button>
                        <Button onClick={handleOnClose}>Close</Button>
                    </GOEnrichmentFooterControlsContainer>
                </ModalFooter>
            </ModalContainer>
        </CenteredModal>
    );
};

export default connector(GOEnrichmentAssociationsModal);
