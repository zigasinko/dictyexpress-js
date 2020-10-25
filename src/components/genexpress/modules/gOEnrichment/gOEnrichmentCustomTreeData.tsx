import React, { ChangeEvent, ReactElement, useEffect, useRef, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from 'redux/rootReducer';
import { genesHighlighted, getSelectedGenes } from 'redux/stores/genes';
import { Button, MenuItem, Tooltip } from '@material-ui/core';
import {
    getGOEnrichmentJson,
    getIsFetchingGOEnrichmentJson,
    getPValueThreshold,
    gOEnrichmentRowToggled,
    pValueThresholdChanged,
} from 'redux/stores/gOEnrichment';
import { Aspect, Gene, GOEnrichmentRow } from 'redux/models/internal';
import { GOEnrichmentJson } from '@genialis/resolwe/dist/api/types/rest';
import _ from 'lodash';
import DictyGrid from 'components/genexpress/common/dictyGrid/dictyGrid';
import DictySelect from 'components/genexpress/common/dictySelect/dictySelect';
import { formatNumber } from 'utils/math';
import { SortChangedEvent, ValueFormatterParams } from 'ag-grid-community';
import {
    GOEnrichmentContainer,
    GOEnrichmentControl,
    GOEnrichmentControls,
    GOEnrichmentGridContainer,
} from './gOEnrichment.styles';
import GOEnrichmentScoreCell from './scoreCell/gOEnrichmentScoreCell';
import gOEnrichmentMatchedCell from './gOEnrichmentMatchedCell/gOEnrichmentMatchedCell';
import GOEnrichmentTermCell from './gOEnrichmentTermCell/gOEnrichmentTermCell';
import GOEnrichmentAssociationsModal from './gOEnrichmentAssociationsModal/gOEnrichmentAssociationsModal';
import { ontologyJsonToOntologyRows } from './gOEnrichmentUtils';

const mapStateToProps = (
    state: RootState,
): {
    pValueThreshold: number;
    selectedGenes: Gene[];
    isFetchingGOEnrichmentJson: boolean;
    gOEnrichmentJson: GOEnrichmentJson;
} => {
    return {
        pValueThreshold: getPValueThreshold(state.gOEnrichment),
        selectedGenes: getSelectedGenes(state.genes),
        isFetchingGOEnrichmentJson: getIsFetchingGOEnrichmentJson(state.gOEnrichment),
        gOEnrichmentJson: getGOEnrichmentJson(state.gOEnrichment),
    };
};

const connector = connect(mapStateToProps, {
    connectedGenesHighlighted: genesHighlighted,
    connectedPValueThresholdChanged: pValueThresholdChanged,
    connectedGOEnrichmentRowToggled: gOEnrichmentRowToggled,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

const aspectOptions: Aspect[] = [
    { value: 'BP', label: 'Biological process' },
    { value: 'CC', label: 'Cellular component' },
    { value: 'MF', label: 'Molecular function' },
];

const pValueThresholdsOptions = [0.1, 0.05, 0.01, 0.001, 0.0001];

const GOEnrichmentCustomTreeData = ({
    gOEnrichmentJson,
    pValueThreshold,
    selectedGenes,
    connectedPValueThresholdChanged,
    connectedGOEnrichmentRowToggled,
    isFetchingGOEnrichmentJson,
}: PropsFromRedux): ReactElement => {
    const [selectedAspect, setSelectedAspect] = useState(aspectOptions[0]);
    const [gOEnrichmentRows, setGOEnrichmentRows] = useState<GOEnrichmentRow[]>([]);
    const [allAspectsEmpty, setAllAspectsEmpty] = useState<boolean>();
    const [treeView, setTreeView] = useState(true);
    const [sortModel, setSortModel] = useState<{ field: string; order: string } | null>(null);
    const [gOEnrichmentAssociationsModalOpened, setGOEnrichmentAssociationsModalOpened] = useState(
        false,
    );
    const [clickedGOEnrichmentRow, setClickedGOEnrichmentRow] = useState<GOEnrichmentRow>(
        {} as GOEnrichmentRow,
    );

    useEffect(() => {
        if (_.isEmpty(gOEnrichmentJson)) {
            return;
        }

        let rows = ontologyJsonToOntologyRows(gOEnrichmentJson, selectedAspect.value);
        // If user is sorting gene ontology enrichment data, exclude duplicates.
        if (!treeView) {
            rows = _.uniqBy(rows, (row) => row.term_id);
        }
        setGOEnrichmentRows(rows);
    }, [gOEnrichmentJson, selectedAspect.value, treeView]);

    useEffect(() => {
        if (_.isEmpty(gOEnrichmentJson)) {
            setAllAspectsEmpty(true);
        }

        const valuesInAllAspects = _.flatten(_.values(gOEnrichmentJson.tree));
        setAllAspectsEmpty(_.isEmpty(valuesInAllAspects));
    }, [gOEnrichmentJson]);

    const handleAspectsOnChange = (event: ChangeEvent<{ value: unknown }>): void => {
        const selectedAspectOption = aspectOptions.find(
            (aspectOption) => aspectOption.value === event.target.value,
        );
        if (selectedAspectOption != null) {
            setSelectedAspect(selectedAspectOption);
        }
    };

    const handlePValueThresholdChange = (event: ChangeEvent<{ value: unknown }>): void => {
        connectedPValueThresholdChanged(event.target.value as number);
    };

    /**
     * Checks if sorting is applied and disabled tree view if it is.
     * @param event - Ag-Grid SortChangedEvent.
     */
    const handleOnSortChanged = (event: SortChangedEvent): void => {
        // If tree view is already displayed, wait until user manually switches back to
        // hierarchical view.
        if (!treeView) {
            return;
        }
        const columnsState = event.columnApi.getColumnState();
        const sortedColumn = columnsState.find((columnState) => columnState.sort != null);
        if (sortedColumn != null) {
            setTreeView(false);
            setSortModel({
                field: sortedColumn.colId as string,
                order: sortedColumn.sort as string,
            });
        }
    };

    const getSort = (field: string): string | undefined => {
        if (treeView) {
            return undefined;
        }
        return sortModel != null && sortModel.field === field ? sortModel.order : undefined;
    };

    /**
     * Expend or collapse row and it's descendants.
     * @param row - GOEnrichmentRow data.
     */
    const onToggleClick = (row: GOEnrichmentRow): void => {
        // Do nothing with leaf rows.
        if (row.collapsed == null) {
            return;
        }

        connectedGOEnrichmentRowToggled({ aspect: selectedAspect.value, row });
    };

    /**
     * Open associations modal.
     * @param row - GOEnrichmentRow data.
     */
    const onMatchedGenesClick = (row: GOEnrichmentRow): void => {
        setClickedGOEnrichmentRow(row);
        setGOEnrichmentAssociationsModalOpened(true);
    };

    const isDisabled = selectedGenes.length === 0;

    return (
        <>
            <GOEnrichmentContainer>
                <Tooltip
                    title={
                        isDisabled
                            ? "Gene Ontology Enrichment can't be enabled until at least one gene is selected."
                            : ''
                    }
                >
                    <GOEnrichmentControls>
                        <GOEnrichmentControl>
                            <DictySelect
                                disabled={isDisabled}
                                label="Aspect"
                                value={selectedAspect.value}
                                handleOnChange={handleAspectsOnChange}
                            >
                                {aspectOptions.map((aspectOption) => (
                                    <MenuItem value={aspectOption.value} key={aspectOption.value}>
                                        {aspectOption.label}
                                    </MenuItem>
                                ))}
                            </DictySelect>
                        </GOEnrichmentControl>
                        <GOEnrichmentControl>
                            <DictySelect
                                disabled={isDisabled}
                                label="p-value"
                                value={pValueThreshold}
                                handleOnChange={handlePValueThresholdChange}
                            >
                                {pValueThresholdsOptions.map((pValueThresholdOption) => (
                                    <MenuItem
                                        value={pValueThresholdOption}
                                        key={pValueThresholdOption}
                                    >
                                        {pValueThresholdOption}
                                    </MenuItem>
                                ))}
                            </DictySelect>
                        </GOEnrichmentControl>
                        <GOEnrichmentControl>
                            {isFetchingGOEnrichmentJson &&
                                `Computing Gene Ontology Enrichment for ${selectedGenes.length} genes.`}
                        </GOEnrichmentControl>
                        {gOEnrichmentRows.length > 0 && !treeView && (
                            <GOEnrichmentControl>
                                <Button onClick={(): void => setTreeView(true)}>Hierarchy</Button>
                            </GOEnrichmentControl>
                        )}
                    </GOEnrichmentControls>
                </Tooltip>
                <GOEnrichmentGridContainer>
                    {gOEnrichmentRows.length > 0 && (
                        <DictyGrid
                            key={`treeView${treeView}`}
                            isFetching={isFetchingGOEnrichmentJson}
                            data={gOEnrichmentRows}
                            hideFilter
                            columnDefs={[
                                {
                                    field: 'term_name',
                                    headerName: 'Term',
                                    flex: 1,
                                    sortable: false,
                                    cellRendererFramework: treeView ? GOEnrichmentTermCell : null,
                                    cellRendererParams: treeView
                                        ? {
                                              onToggleClick,
                                          }
                                        : null,
                                },
                                {
                                    field: 'pval',
                                    headerName: 'p-value',
                                    width: 60,
                                    sort: getSort('pval'),
                                    valueFormatter: ({ value }: ValueFormatterParams): string =>
                                        formatNumber(value, 'long'),
                                },
                                {
                                    field: 'score',
                                    headerName: 'Score',
                                    sort: getSort('score'),
                                    cellRendererFramework: GOEnrichmentScoreCell,
                                    width: 60,
                                },
                                {
                                    field: 'matched',
                                    headerName: 'N',
                                    width: 60,
                                    sort: getSort('matched'),
                                    cellRendererFramework: gOEnrichmentMatchedCell,
                                    cellRendererParams: {
                                        onMatchedGenesClick,
                                    },
                                },
                            ]}
                            onSortChanged={handleOnSortChanged}
                            // Path must also be included as a unique identifier because the same
                            // term_id can be found in multiple tree branches.
                            getRowId={(data): string => data.term_id + data.path.toString()}
                        />
                    )}
                    {allAspectsEmpty && 'Enriched terms not found.'}
                    {!allAspectsEmpty &&
                        gOEnrichmentRows.length === 0 &&
                        'Enriched terms not found within selected aspect.'}
                </GOEnrichmentGridContainer>
            </GOEnrichmentContainer>
            {gOEnrichmentAssociationsModalOpened && (
                <GOEnrichmentAssociationsModal
                    gOEnrichmentRow={clickedGOEnrichmentRow}
                    handleOnClose={(): void => setGOEnrichmentAssociationsModalOpened(false)}
                />
            )}
        </>
    );
};

export default connector(GOEnrichmentCustomTreeData);
