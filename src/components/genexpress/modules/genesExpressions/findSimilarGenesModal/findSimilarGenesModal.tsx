import React, { ChangeEvent, ReactElement, useEffect, useRef, useState } from 'react';
import {
    ModalBody,
    ModalHeader,
    ModalContainer,
    CenteredModal,
} from 'components/genexpress/common/dictyModal/dictyModal.styles';
import DictyGrid from 'components/genexpress/common/dictyGrid/dictyGrid';
import GeneSelectorModalControls from 'components/genexpress/modules/timeSeriesAndGeneSelector/geneSelector/geneSelectorModalControls/geneSelectorModalControls';
import { Gene, GenesById, GeneSimilarity, Option } from 'redux/models/internal';
import { connect, ConnectedProps } from 'react-redux';
import { getGenesById, getIsFetchingSimilarGenes, getSelectedGenes } from 'redux/stores/genes';
import { RootState } from 'redux/rootReducer';
import { ValueGetterParams } from 'ag-grid-community';
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
    { value: DistanceMeasure.pearson, label: 'Pearson' },
    { value: DistanceMeasure.spearman, label: 'Spearman' },
];

const mapStateToProps = (
    state: RootState,
): {
    genesById: GenesById;
    selectedGenes: Gene[];
    queryGeneId: string | null;
    distanceMeasure: DistanceMeasure;
    genesSimilarities: GeneSimilarity[];
    isFetchingGenesSimilarities: boolean;
    isFetchingSimilarGenes: boolean;
} => {
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

    // Prepare data -> attach Gene to each similar gene distance.
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

    // Propagate already selected genes to selected volcano points.
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

    // When modal opens, fetch all genes that are associated with clicked gene ontology enrichment row.
    useEffect(() => {
        connectedFetchGenesSimilarities();
    }, [connectedFetchGenesSimilarities]);

    const handleGeneOnChange = (event: ChangeEvent<{ value: unknown }>): void => {
        connectedGenesSimilaritiesQueryGeneSelected(event.target.value as string);
        // Unfocus select element.
        document.body.focus();
    };

    const handleDistanceMeasureChange = (event: ChangeEvent<{ value: unknown }>): void => {
        connectedGenesSimilaritiesDistanceMeasureChanged(event.target.value as DistanceMeasure);
    };

    const columnDefs = useRef([
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
        /* {
            valueGetter: (params: ValueGetterParams): number => {
                return params.data.point.logFcValue;
            },
            headerName: 'log2(Fold Change)',
            width: 90,
        },
        {
            valueGetter: (params: ValueGetterParams): number => {
                return params.data.point.logProbValue;
            },
            headerName: probFieldLabel,
            width: 90,
        }, */
    ]);

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
                            handleOnChange={handleDistanceMeasureChange}
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
                            columnDefs={columnDefs.current}
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
