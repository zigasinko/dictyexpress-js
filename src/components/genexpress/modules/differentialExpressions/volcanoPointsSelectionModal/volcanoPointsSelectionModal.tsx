import React, { ReactElement, useEffect, useRef, useState } from 'react';
import Button from '@material-ui/core/Button';
import {
    ModalFooter,
    ModalBody,
    ModalHeader,
    ModalContainer,
    CenteredModal,
    FooterControlsContainer,
} from 'components/genexpress/common/dictyModal/dictyModal.styles';
import DictyGrid from 'components/genexpress/common/dictyGrid/dictyGrid';
import { Gene, VolcanoPoint } from 'redux/models/internal';
import { Checkbox, FormControlLabel } from '@material-ui/core';
import { connect, ConnectedProps } from 'react-redux';
import {
    allGenesDeselected,
    genesSelected,
    getGenes,
    getSelectedGenesIds,
} from 'redux/stores/genes';
import { RootState } from 'redux/rootReducer';
import { ValueGetterParams } from 'ag-grid-community';
import {
    DifferentialExpressionInfo,
    GeneVolcanoPointsGridWrapper,
} from './volcanoPointsSelectionModal.styles';

const mapStateToProps = (
    state: RootState,
): {
    genes: Gene[];
    selectedGenesIds: string[];
} => {
    return {
        // Genes to be visualized.
        genes: getGenes(state.genes),
        selectedGenesIds: getSelectedGenesIds(state.genes),
    };
};

const connector = connect(mapStateToProps, {
    connectedGenesSelected: genesSelected,
    connectedAllGenesDeselected: allGenesDeselected,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

type GeneVolcanoPoint = {
    gene?: Gene;
    point: VolcanoPoint;
};

type VolcanoPointSelectionModalProps = {
    differentialExpressionName: string;
    probFieldLabel: string;
    volcanoPoints: VolcanoPoint[];
    handleOnClose: () => void;
} & PropsFromRedux;

const VolcanoPointSelectionModal = ({
    differentialExpressionName,
    probFieldLabel,
    volcanoPoints,
    selectedGenesIds,
    genes,
    handleOnClose,
    connectedGenesSelected,
    connectedAllGenesDeselected,
}: VolcanoPointSelectionModalProps): ReactElement => {
    const [append, setAppend] = useState(true);
    const [geneVolcanoPoints, setGeneVolcanoPoints] = useState<GeneVolcanoPoint[]>([]);
    const [selectedGeneVolcanoPoints, setSelectedGeneVolcanoPoints] = useState<GeneVolcanoPoint[]>(
        [],
    );

    // Prepare data -> attach Gene to each volcano point.
    useEffect(() => {
        const newGeneVolcanoPoints: GeneVolcanoPoint[] = [];
        volcanoPoints.forEach((volcanoPoint) => {
            newGeneVolcanoPoints.push({
                gene: genes.find((gene) => gene.feature_id === volcanoPoint.geneId),
                point: volcanoPoint,
            });
        });

        setGeneVolcanoPoints(newGeneVolcanoPoints);
    }, [genes, volcanoPoints]);

    // Propagate already selected genes to selected volcano points.
    useEffect(() => {
        setSelectedGeneVolcanoPoints(
            geneVolcanoPoints.filter((geneVolcanoPoint) =>
                selectedGenesIds.includes(geneVolcanoPoint.point.geneId),
            ),
        );
    }, [geneVolcanoPoints, selectedGenesIds]);

    const handleAppendCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setAppend(event.target.checked);
    };

    /**
     * Handles user points selection in volcano point selection modal.
     *  -> Updates (appends) redux store with selected genes.
     * @param genesIds - IDs of genes that were selected on differential expressions volcano plot.
     */
    const appendSelectedGenes = (genesIds: string[]): void => {
        connectedGenesSelected(genesIds);
        handleOnClose();
    };

    /**
     * Handles user points selection in volcano point selection modal.
     *  -> Sets redux store with selected genes (already selected are cleared first).
     * @param genesIds - IDs of genes that were selected on differential expressions volcano plot.
     */
    const setSelectedGenes = (genesIds: string[]): void => {
        connectedAllGenesDeselected();
        connectedGenesSelected(genesIds);
        handleOnClose();
    };

    const handleSelectOnClick = (): void => {
        const selectedVolcanoPointsGenesIds = selectedGeneVolcanoPoints.map(
            (geneVolcanoPoint) => geneVolcanoPoint.point.geneId,
        );
        if (append) {
            appendSelectedGenes(selectedVolcanoPointsGenesIds);
        } else {
            setSelectedGenes(selectedVolcanoPointsGenesIds);
        }
    };

    const handleSelectAllOnClick = (): void => {
        const allGeneIds = volcanoPoints.map((volcanoPoint) => volcanoPoint.geneId);
        if (append) {
            appendSelectedGenes(allGeneIds);
        } else {
            setSelectedGenes(allGeneIds);
        }
    };

    const columnDefs = useRef([
        {
            headerCheckboxSelection: true,
            checkboxSelection: true,
            width: 25,
        },
        {
            valueGetter: (params: ValueGetterParams): string => {
                return params.data.point.geneId;
            },
            headerName: 'ID',
            width: 90,
        },
        {
            valueGetter: (params: ValueGetterParams): string => {
                return params.data.gene?.name;
            },
            headerName: 'Name',
            width: 90,
            sort: 'asc',
        },
        {
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
                <ModalHeader id="modalTitle">Selected Differential Expression Genes</ModalHeader>
                <ModalBody>
                    <DifferentialExpressionInfo id="modalDescription">
                        Differential Expression: {differentialExpressionName}
                    </DifferentialExpressionInfo>
                    <GeneVolcanoPointsGridWrapper>
                        <DictyGrid
                            data={geneVolcanoPoints}
                            getRowId={(data): string => data.point.geneId}
                            filterLabel="Filter"
                            selectedData={selectedGeneVolcanoPoints}
                            columnDefs={columnDefs.current}
                            selectionMode="multiple"
                            onSelectionChanged={setSelectedGeneVolcanoPoints}
                        />
                    </GeneVolcanoPointsGridWrapper>
                </ModalBody>
                <ModalFooter>
                    <FooterControlsContainer>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={append}
                                    onChange={handleAppendCheckboxChange}
                                    name="append"
                                />
                            }
                            label="Append selected genes to Genes module"
                        />
                        <div>
                            <Button
                                onClick={handleSelectOnClick}
                                disabled={selectedGeneVolcanoPoints.length === 0}
                            >
                                Select
                            </Button>
                            <Button onClick={handleSelectAllOnClick}>
                                Select all {volcanoPoints.length}
                            </Button>
                            <Button onClick={handleOnClose}>Close</Button>
                        </div>
                    </FooterControlsContainer>
                </ModalFooter>
            </ModalContainer>
        </CenteredModal>
    );
};

export default connector(VolcanoPointSelectionModal);
