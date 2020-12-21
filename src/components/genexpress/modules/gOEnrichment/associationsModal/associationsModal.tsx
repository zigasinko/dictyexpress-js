import React, { ReactElement, useEffect, useRef, useState } from 'react';
import {
    ModalBody,
    ModalHeader,
    ModalContainer,
    CenteredModal,
} from 'components/genexpress/common/dictyModal/dictyModal.styles';
import DictyGrid from 'components/genexpress/common/dictyGrid/dictyGrid';
import GeneSelectorModalControls from 'components/genexpress/modules/timeSeriesAndGeneSelector/geneSelector/geneSelectorModalControls/geneSelectorModalControls';
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
import {
    TermInfo,
    TermName,
    AssociationsGridWrapper,
    AmigoLink,
    AmigoLinkImage,
} from './associationsModal.style';

const mapStateToProps = (
    state: RootState,
): {
    genesById: GenesById;
    selectedGenesIds: string[];
    isFetchingAssociationsGenes: boolean;
} => {
    return {
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

    const columnDefs = useRef([
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
    ]);

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
                        <TermName>{gOEnrichmentRow.term_name}</TermName>
                        <Tooltip title="Open in AmiGO">
                            <AmigoLink
                                href={`http://amigo.geneontology.org/amigo/term/${gOEnrichmentRow.term_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {gOEnrichmentRow.term_id}
                                <AmigoLinkImage src={amigoLogo} alt="AmiGO link" />
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
                                columnDefs={columnDefs.current}
                                selectionMode="multiple"
                                onSelectionChanged={setSelectedAssociatedGenes}
                            />
                        )}
                    </AssociationsGridWrapper>
                </ModalBody>
                <GeneSelectorModalControls
                    allGenesIds={associatedGenes.map((gene) => gene.feature_id)}
                    selectedGenesIds={selectedAssociatedGenes.map((gene) => gene.feature_id)}
                    onClose={handleOnClose}
                />
            </ModalContainer>
        </CenteredModal>
    );
};

export default connector(GOEnrichmentAssociationsModal);
