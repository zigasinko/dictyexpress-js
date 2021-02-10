import React, { ChangeEvent, ReactElement, useCallback, useEffect, useState } from 'react';
import { Button, MenuItem, Tooltip } from '@material-ui/core';
import { pValueThresholdsOptions } from 'redux/stores/gOEnrichment';
import { Option, GOEnrichmentRow } from 'redux/models/internal';
import _ from 'lodash';
import DictyGrid from 'components/genexpress/common/dictyGrid/dictyGrid';
import DictySelect from 'components/genexpress/common/dictySelect/dictySelect';
import { formatNumber } from 'utils/math';
import { SortChangedEvent, ValueFormatterParams } from 'ag-grid-community';
import { ontologyJsonToOntologyRows } from 'utils/gOEnrichmentUtils';
import useStateWithEffect from 'components/genexpress/common/useStateWithEffect';
import { AspectValue } from 'components/genexpress/common/constants';
import { useMobxStore } from 'components/app/mobxStoreProvider';
import { autorun, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import ScoreCell from './scoreCell/scoreCell';
import {
    GOEnrichmentContainer,
    GOEnrichmentControl,
    GOEnrichmentControls,
    GOEnrichmentGridContainer,
} from './gOEnrichment.styles';
import GOEnrichmentMatchedCell from './matchedCell/matchedCell';
import TermCell from './termCell/termCell';
import GOEnrichmentAssociationsModal from './associationsModal/associationsModal';

export const aspectOptions: Option<AspectValue>[] = [
    { value: AspectValue.bp, label: 'Biological process' },
    { value: AspectValue.cc, label: 'Cellular component' },
    { value: AspectValue.mf, label: 'Molecular function' },
];

const GOEnrichmentMobx = (): ReactElement => {
    const storeMobx = useMobxStore();

    const [selectedAspectOption] = useState(() =>
        observable({
            selected: aspectOptions[0],
            setSelected(value: Option<AspectValue>) {
                // eslint-disable-next-line react/no-this-in-sfc
                this.selected = value;
            },
        }),
    );
    const [gOEnrichmentRows, setGOEnrichmentRows] = useState<GOEnrichmentRow[]>([]);
    const [allAspectsEmpty, setAllAspectsEmpty] = useState(true);
    const [treeView] = useState(() =>
        observable({
            isEnabled: true,
            setTreeView(value: boolean) {
                // eslint-disable-next-line react/no-this-in-sfc
                this.isEnabled = value;
            },
        }),
    );
    const [sortModel, setSortModel] = useState<{ field: string; order: string } | null>(null);
    const [gOEnrichmentAssociationsModalOpened, setGOEnrichmentAssociationsModalOpened] = useState(
        false,
    );
    const [clickedGOEnrichmentRow, setClickedGOEnrichmentRow] = useState<GOEnrichmentRow>(
        {} as GOEnrichmentRow,
    );

    useEffect(() => {
        autorun(() => {
            if (storeMobx.gOEnrichment.json == null) {
                setGOEnrichmentRows([]);
                return;
            }

            let rows = ontologyJsonToOntologyRows(
                storeMobx.gOEnrichment.json,
                selectedAspectOption.selected.value,
                true,
            );

            // If user is sorting gene ontology enrichment data, exclude duplicates.
            if (!treeView.isEnabled) {
                rows = _.uniqBy(rows, (row) => row.term_id);
            }

            setGOEnrichmentRows(rows);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        autorun(() => {
            if (storeMobx.gOEnrichment.json == null) {
                setAllAspectsEmpty(true);
                return;
            }

            const valuesInAllAspects = _.flatten(_.values(storeMobx.gOEnrichment.json.tree));
            setAllAspectsEmpty(_.isEmpty(valuesInAllAspects));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAspectsOnChange = (event: ChangeEvent<{ value: unknown }>): void => {
        const newSelectedAspectOption = aspectOptions.find(
            (aspectOption) => aspectOption.value === event.target.value,
        );
        if (newSelectedAspectOption != null) {
            selectedAspectOption.setSelected(newSelectedAspectOption);
        }
    };

    const handlePValueThresholdChange = (event: ChangeEvent<{ value: unknown }>): void => {
        storeMobx.gOEnrichment.setPValueThreshold(event.target.value as number);
    };

    const onSortChangedHandler = (event: SortChangedEvent): void => {
        // If tree view is already displayed, wait until user manually switches back to
        // hierarchical view.
        if (!treeView.isEnabled) {
            return;
        }
        const columnsState = event.columnApi.getColumnState();
        const sortedColumn = columnsState.find((columnState) => columnState.sort != null);
        if (sortedColumn != null && sortedColumn.colId != null && sortedColumn.sort != null) {
            treeView.setTreeView(false);
            setSortModel({
                field: sortedColumn.colId,
                order: sortedColumn.sort,
            });
        }
    };

    const getSort = useCallback(
        (field: string): string | undefined => {
            if (treeView.isEnabled) {
                return undefined;
            }
            return sortModel != null && sortModel.field === field ? sortModel.order : undefined;
        },
        [sortModel, treeView.isEnabled],
    );

    const onMatchedGenesClickHandler = (row: GOEnrichmentRow): void => {
        setClickedGOEnrichmentRow(row);
        setGOEnrichmentAssociationsModalOpened(true);
    };

    const columnDefs = useStateWithEffect(
        () => [
            {
                field: 'pval',
                headerName: 'p-value',
                width: 85,
                sort: getSort('pval'),
                valueFormatter: ({ value }: ValueFormatterParams): string =>
                    formatNumber(value, 'long'),
            },
            {
                field: 'score',
                headerName: 'Score',
                sort: getSort('score'),
                cellRendererFramework: ScoreCell,
                minWidth: 85,
            },
            {
                field: 'matched',
                headerName: 'N',
                width: 100,
                sort: getSort('matched'),
                cellRendererFramework: GOEnrichmentMatchedCell,
                cellRendererParams: {
                    onMatchedGenesClick: onMatchedGenesClickHandler,
                },
            },
            {
                field: 'term_name',
                headerName: 'Term',
                width: 400,
                sortable: !treeView.isEnabled,
                cellRendererFramework: treeView.isEnabled ? TermCell : null,
            },
        ],
        [getSort, treeView.isEnabled],
    );

    return (
        <>
            <GOEnrichmentContainer>
                <Tooltip title="asdf">
                    <GOEnrichmentControls>
                        <GOEnrichmentControl>
                            <DictySelect
                                disabled={allAspectsEmpty}
                                label="Aspect"
                                value={selectedAspectOption.selected.value}
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
                                disabled={
                                    // storeMobx.genes.selectedGenes.length === 0 ||
                                    storeMobx.gOEnrichment.isLoading
                                }
                                label="p-value"
                                value={storeMobx.gOEnrichment.pValueThreshold}
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
                        {gOEnrichmentRows.length > 0 && (
                            <GOEnrichmentControl>
                                {treeView.isEnabled && (
                                    <Tooltip title="View terms in a sortable grid (instead of hierarchical tree)">
                                        <Button onClick={(): void => treeView.setTreeView(false)}>
                                            Flat
                                        </Button>
                                    </Tooltip>
                                )}
                                {!treeView.isEnabled && (
                                    <Tooltip title="View terms in a hierarchical tree">
                                        <Button onClick={(): void => treeView.setTreeView(true)}>
                                            Hierarchy
                                        </Button>
                                    </Tooltip>
                                )}
                            </GOEnrichmentControl>
                        )}
                    </GOEnrichmentControls>
                </Tooltip>
                <GOEnrichmentGridContainer>
                    {gOEnrichmentRows.length > 0 && (
                        <DictyGrid
                            isFetching={storeMobx.gOEnrichment.isLoading}
                            data={gOEnrichmentRows}
                            hideFilter
                            disableSizeColumnsToFit
                            columnDefs={columnDefs}
                            onSortChanged={onSortChangedHandler}
                            // Path must also be included as a unique identifier because the same
                            // term_id can be found in multiple tree branches.
                            getRowId={(data): string => data.term_id + data.path.toString()}
                        />
                    )}
                    {storeMobx.gOEnrichment.isLoading &&
                        `Computing Gene Ontology Enrichment for ${storeMobx.genes.selectedGenes.length} genes.`}
                    {/* Only display info's about enriched terms when fetching data is complete. */}
                    {storeMobx.gOEnrichment.isLoading === false &&
                        allAspectsEmpty &&
                        'Enriched terms not found.'}
                    {storeMobx.gOEnrichment.isLoading === false &&
                        !allAspectsEmpty &&
                        gOEnrichmentRows.length === 0 &&
                        'Enriched terms not found within selected aspect.'}
                    <br />
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

export default observer(GOEnrichmentMobx);
