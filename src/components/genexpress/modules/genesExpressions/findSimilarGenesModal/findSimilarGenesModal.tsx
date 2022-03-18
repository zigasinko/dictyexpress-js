import React, { ChangeEvent, ReactElement, useEffect, useState } from 'react';
import {
    ModalBody,
    ModalHeader,
    ModalContainer,
    CenteredModal,
} from 'components/genexpress/common/dictyModal/dictyModal.styles';
import DictyGrid from 'components/genexpress/common/dictyGrid/dictyGrid';
import GeneSelectorModalControls from 'components/genexpress/common/geneSelectorModalControls/geneSelectorModalControls';
import { Gene, Option } from 'redux/models/internal';
import { connect, ConnectedProps } from 'react-redux';
import { getGenesById, getIsFetchingSimilarGenes, getSelectedGenes } from 'redux/stores/genes';
import { RootState } from 'redux/rootReducer';
import { ColDef, ValueGetterParams } from 'ag-grid-community';
import { MenuItem } from '@material-ui/core';
import DictySelect from 'components/genexpress/common/dictySelect/dictySelect';
import { fetchGenesSimilarities } from 'redux/epics/epicsActions';
import {
    genesSimilaritiesDistanceMeasureChanged,
    genesSimilaritiesQueryGeneSelected,
    getGenesSimilarities,
    getGenesSimilaritiesDistanceMeasure,
    getGenesSimilaritiesQueryGeneId,
    getIsFetchingGenesSimilarities,
} from 'redux/stores/genesSimilarities';
import { formatNumber } from 'utils/math';
import { DistanceMeasure } from 'components/genexpress/common/constants';
import {
    QueryGeneSelectFormControl,
    SimilarGenesGridWrapper,
    DistanceMeasureFormControl,
} from './findSimilarGenesModal.styles';
import ToDictybaseCell from './toDictybaseCell/toDictybaseCell';

export const distanceMeasureOptions: Option<DistanceMeasure>[] = [
    { value: DistanceMeasure.spearman, label: 'Spearman' },
    { value: DistanceMeasure.pearson, label: 'Pearson' },
];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mapStateToProps = (state: RootState) => {
    return {
        genesById: getGenesById(state.genes),
        selectedGenes: getSelectedGenes(state.genes),
        queryGeneId: getGenesSimilaritiesQueryGeneId(state.genesSimilarities),
        distanceMeasure: getGenesSimilaritiesDistanceMeasure(state.genesSimilarities),
        genesSimilarities: getGenesSimilarities(state.genesSimilarities),
        isFetchingGenesSimilarities: getIsFetchingGenesSimilarities(state.genesSimilarities),
        isFetchingSimilarGenes: getIsFetchingSimilarGenes(state.genes),
    };
};

const connector = connect(mapStateToProps, {
    connectedFetchGenesSimilarities: fetchGenesSimilarities,
    connectedGenesSimilaritiesQueryGeneSelected: genesSimilaritiesQueryGeneSelected,
    connectedGenesSimilaritiesDistanceMeasureChanged: genesSimilaritiesDistanceMeasureChanged,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

type FindSimilarGenesModalProps = {
    handleOnClose: () => void;
} & PropsFromRedux;

type SimilarGene = { distance: number } & Pick<Gene, 'feature_id' | 'name' | 'description'>;

const columnDefs = [
    {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        width: 25,
    },
    {
        valueGetter: (params: ValueGetterParams): string => {
            return formatNumber(params.data.distance, 'long');
        },
        headerName: 'Score',
        width: 90,
        sort: 'desc',
    },
    {
        valueGetter: (params: ValueGetterParams): string => {
            return params.data.name;
        },
        headerName: 'Name',
        width: 90,
    },
    {
        valueGetter: (params: ValueGetterParams): string => {
            return params.data.description;
        },
        headerName: 'Description',
    },
    {
        field: 'feature_id',
        headerName: 'Gene ID',
        cellRendererFramework: ToDictybaseCell,
    },
] as ColDef[];

const FindSimilarGenesModal = ({
    genesById,
    selectedGenes,
    genesSimilarities,
    queryGeneId,
    distanceMeasure,
    handleOnClose,
    isFetchingGenesSimilarities,
    isFetchingSimilarGenes,
    connectedFetchGenesSimilarities,
    connectedGenesSimilaritiesQueryGeneSelected,
    connectedGenesSimilaritiesDistanceMeasureChanged,
}: FindSimilarGenesModalProps): ReactElement => {
    const [similarGenes, setSimilarGenes] = useState<SimilarGene[]>([]);

    const [queryGene, setQueryGene] = useState<Gene>();
    const [selectedSimilarGenes, setSelectedSimilarGenes] = useState<SimilarGene[]>([]);

    useEffect(() => {
        setSimilarGenes(
            genesSimilarities.flatMap((geneSimilarity) => ({
                feature_id: geneSimilarity.gene,
                name: genesById[geneSimilarity.gene]?.name,
                description: genesById[geneSimilarity.gene]?.description,
                distance: geneSimilarity.distance,
            })),
        );
    }, [genesById, genesSimilarities]);

    useEffect(() => {
        setSelectedSimilarGenes(
            similarGenes.filter((similarGene) =>
                selectedGenes
                    .map((selectedGene) => selectedGene.feature_id)
                    .includes(similarGene.feature_id),
            ),
        );
    }, [selectedGenes, similarGenes]);

    useEffect(() => {
        setQueryGene(selectedGenes.find((gene) => gene.feature_id === queryGeneId));
    }, [queryGeneId, selectedGenes]);

    useEffect(() => {
        connectedFetchGenesSimilarities();
    }, [connectedFetchGenesSimilarities]);

    const handleGeneOnChange = (event: ChangeEvent<{ value: unknown }>): void => {
        connectedGenesSimilaritiesQueryGeneSelected(event.target.value as string);

        document.body.focus();
    };

    return (
        <CenteredModal
            open
            aria-labelledby="modalTitle"
            aria-describedby="modalDescription"
            onClose={handleOnClose}
        >
            <ModalContainer>
                <ModalHeader id="modalTitle">Find Similar Genes</ModalHeader>
                <ModalBody>
                    <QueryGeneSelectFormControl>
                        <DictySelect
                            label="Gene"
                            value={queryGene?.feature_id}
                            handleOnChange={handleGeneOnChange}
                            disabled={selectedGenes.length === 0}
                        >
                            {selectedGenes.map((gene) => (
                                <MenuItem value={gene.feature_id} key={gene.feature_id}>
                                    {gene.name}
                                </MenuItem>
                            ))}
                        </DictySelect>
                    </QueryGeneSelectFormControl>
                    <DistanceMeasureFormControl>
                        <DictySelect
                            disabled={selectedGenes.length === 0}
                            label="Distance Measure"
                            value={distanceMeasure}
                            handleOnChange={(event: ChangeEvent<{ value: unknown }>): void => {
                                connectedGenesSimilaritiesDistanceMeasureChanged(
                                    event.target.value as DistanceMeasure,
                                );
                            }}
                        >
                            {distanceMeasureOptions.map((distanceMeasureOption) => (
                                <MenuItem
                                    value={distanceMeasureOption.value}
                                    key={distanceMeasureOption.value}
                                >
                                    {distanceMeasureOption.label}
                                </MenuItem>
                            ))}
                        </DictySelect>
                    </DistanceMeasureFormControl>
                    <SimilarGenesGridWrapper>
                        <DictyGrid
                            data={similarGenes}
                            isFetching={isFetchingGenesSimilarities || isFetchingSimilarGenes}
                            getRowId={(data): string => data.feature_id}
                            filterLabel="Filter"
                            selectedData={selectedSimilarGenes}
                            columnDefs={columnDefs}
                            selectionMode="multiple"
                            onSelectionChanged={setSelectedSimilarGenes}
                        />
                    </SimilarGenesGridWrapper>
                </ModalBody>
                <GeneSelectorModalControls
                    allGenesIds={similarGenes.map((gene) => gene.feature_id)}
                    selectedGenesIds={selectedSimilarGenes.map((gene) => gene.feature_id)}
                    onClose={handleOnClose}
                />
            </ModalContainer>
        </CenteredModal>
    );
};

export default connector(FindSimilarGenesModal);
