import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from 'redux/rootReducer';
import { getSelectedGenes } from 'redux/stores/genes';
import { Button, MenuItem, Tooltip } from '@mui/material';
import {
    getGOEnrichmentJson,
    getIsFetchingGOEnrichmentJson,
    getPValueThreshold,
    pValueThresholdChanged,
    pValueThresholdsOptions,
} from 'redux/stores/gOEnrichment';
import { Option, GOEnrichmentRow } from 'redux/models/internal';
import _ from 'lodash';
import DictyGrid from 'components/genexpress/common/dictyGrid/dictyGrid';
import DictySelect from 'components/genexpress/common/dictySelect/dictySelect';
import { formatNumber } from 'utils/math';
import { ColDef, SortChangedEvent, ValueFormatterParams } from 'ag-grid-community';
import useReport from 'components/genexpress/common/reportBuilder/useReport';
import { objectsArrayToTsv } from 'utils/reportUtils';
import { advancedJoin } from 'utils/arrayUtils';
import { ontologyJsonToOntologyRows, ontologyJsonToTermsTable } from 'utils/gOEnrichmentUtils';
import useStateWithEffect from 'components/genexpress/common/useStateWithEffect';
import { AspectValue, BookmarkStatePath } from 'components/genexpress/common/constants';
import useBookmarkableState from 'components/genexpress/common/useBookmarkableState';
import {
    GOEnrichmentContainer,
    GOEnrichmentControl,
    GOEnrichmentControls,
    GOEnrichmentGridContainer,
} from './gOEnrichment.styles';
import ScoreCell from './scoreCell/scoreCell';
import GOEnrichmentMatchedCell from './matchedCell/matchedCell';
import TermCell from './termCell/termCell';
import GOEnrichmentAssociationsModal from './associationsModal/associationsModal';
import { SelectChangeEvent } from '@mui/material';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mapStateToProps = (state: RootState) => {
    return {
        pValueThreshold: getPValueThreshold(state.gOEnrichment),
        selectedGenes: getSelectedGenes(state.genes),
        isFetchingGOEnrichmentJson: getIsFetchingGOEnrichmentJson(state.gOEnrichment),
        gOEnrichmentJson: getGOEnrichmentJson(state.gOEnrichment),
    };
};

const connector = connect(mapStateToProps, {
    connectedPValueThresholdChanged: pValueThresholdChanged,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

export const aspectOptions: Option<AspectValue>[] = [
    { value: AspectValue.bp, label: 'Biological process' },
    { value: AspectValue.cc, label: 'Cellular component' },
    { value: AspectValue.mf, label: 'Molecular function' },
];

const GOEnrichment = ({
    gOEnrichmentJson,
    pValueThreshold,
    selectedGenes,
    connectedPValueThresholdChanged,
    isFetchingGOEnrichmentJson,
}: PropsFromRedux): ReactElement => {
    const [selectedAspect, setSelectedAspect] = useBookmarkableState(
        aspectOptions[0],
        BookmarkStatePath.gOEnrichmentSelectedAspect,
    );
    const [gOEnrichmentRows, setGOEnrichmentRows] = useState<GOEnrichmentRow[]>([]);
    const [allAspectsEmpty, setAllAspectsEmpty] = useState(true);
    const [treeView, setTreeView] = useState(true);
    const [sortModel, setSortModel] = useState<{ field: string; order: string } | null>(null);
    const [gOEnrichmentAssociationsModalOpened, setGOEnrichmentAssociationsModalOpened] =
        useState(false);
    const [clickedGOEnrichmentRow, setClickedGOEnrichmentRow] = useState<GOEnrichmentRow>(
        {} as GOEnrichmentRow,
    );

    useEffect(() => {
        if (gOEnrichmentJson == null) {
            setGOEnrichmentRows([]);
            return;
        }

        let rows = ontologyJsonToOntologyRows(gOEnrichmentJson, selectedAspect.value, true);

        // If user is sorting gene ontology enrichment data, exclude duplicates.
        if (!treeView) {
            rows = _.uniqBy(rows, (row) => row.term_id);
        }

        setGOEnrichmentRows(rows);
    }, [gOEnrichmentJson, selectedAspect, treeView]);

    useEffect(() => {
        if (gOEnrichmentJson == null) {
            setAllAspectsEmpty(true);
            return;
        }

        const valuesInAllAspects = _.flatten(_.values(gOEnrichmentJson.tree));
        setAllAspectsEmpty(_.isEmpty(valuesInAllAspects));
    }, [gOEnrichmentJson]);

    const getCaption = useCallback((): string => {
        const genes = advancedJoin(selectedGenes.map(({ name }) => name));
        const termTables = advancedJoin(aspectOptions.map(({ label }) => `${label}.tsv`));

        return `
Identified significantly enriched Gene Ontology terms (p-value < ${pValueThreshold})
for selected genes (${genes}).

Tables ${termTables} are sorted by p-value.
A list of all gene associations for each term is available in a separate file - all_associations.tsv.
    `.trim();
    }, [pValueThreshold, selectedGenes]);

    useReport(
        async (processFile) => {
            if (gOEnrichmentJson == null) {
                return;
            }

            const associationsTable = _.flatten(
                _.map(gOEnrichmentJson.gene_associations, (allAssociations, term) => {
                    return _.map(allAssociations, (association) => {
                        return { term, association };
                    });
                }),
            );

            const allAspectsTermsTablePromises = aspectOptions.map(async (aspectOption) => {
                return {
                    termsTable: await ontologyJsonToTermsTable(
                        gOEnrichmentJson,
                        aspectOption.value,
                    ),
                    aspectOption,
                };
            });

            const termTables = await Promise.all(allAspectsTermsTablePromises);

            termTables.forEach(({ termsTable, aspectOption }) => {
                processFile(
                    `Gene Ontology Enrichment Analysis/${aspectOption.label}.tsv`,
                    objectsArrayToTsv(termsTable),
                    false,
                );
            });
            processFile(
                'Gene Ontology Enrichment Analysis/all_associations.tsv',
                objectsArrayToTsv(associationsTable),
                false,
            );
            processFile('Gene Ontology Enrichment Analysis/caption.txt', getCaption(), false);
        },
        [gOEnrichmentJson, getCaption],
    );

    const handleAspectsOnChange = (event: SelectChangeEvent<unknown>): void => {
        const selectedAspectOption = aspectOptions.find(
            (aspectOption) => aspectOption.value === event.target.value,
        );
        if (selectedAspectOption != null) {
            setSelectedAspect(selectedAspectOption);
        }
    };

    const handlePValueThresholdChange = (event: SelectChangeEvent<unknown>): void => {
        connectedPValueThresholdChanged(event.target.value as number);
    };

    const onSortChangedHandler = (event: SortChangedEvent): void => {
        // If tree view is already displayed, wait until user manually switches back to
        // hierarchical view.
        if (!treeView) {
            return;
        }
        const columnsState = event.columnApi.getColumnState();
        const sortedColumn = columnsState.find((columnState) => columnState.sort != null);
        if (sortedColumn != null && sortedColumn.colId != null && sortedColumn.sort != null) {
            setTreeView(false);
            setSortModel({
                field: sortedColumn.colId,
                order: sortedColumn.sort,
            });
        }
    };

    const getSort = useCallback(
        (field: string): string | undefined => {
            if (treeView) {
                return undefined;
            }
            return sortModel != null && sortModel.field === field ? sortModel.order : undefined;
        },
        [sortModel, treeView],
    );

    const onMatchedGenesClickHandler = (row: GOEnrichmentRow): void => {
        setClickedGOEnrichmentRow(row);
        setGOEnrichmentAssociationsModalOpened(true);
    };

    const columnDefs = useStateWithEffect(
        () =>
            [
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
                    cellRenderer: ScoreCell,
                    minWidth: 85,
                },
                {
                    field: 'matched',
                    headerName: 'N',
                    width: 100,
                    sort: getSort('matched'),
                    cellRenderer: GOEnrichmentMatchedCell,
                    cellRendererParams: {
                        onMatchedGenesClick: onMatchedGenesClickHandler,
                    },
                },
                {
                    field: 'term_name',
                    headerName: 'Term',
                    width: 400,
                    sortable: !treeView,
                    cellRenderer: treeView ? TermCell : null,
                },
            ] as ColDef[],
        [getSort, treeView],
    );

    return (
        <>
            <GOEnrichmentContainer>
                <Tooltip
                    title={
                        selectedGenes.length === 0
                            ? "Gene Ontology Enrichment can't be enabled until at least one gene is selected."
                            : ''
                    }
                >
                    <GOEnrichmentControls>
                        <GOEnrichmentControl>
                            <DictySelect
                                disabled={allAspectsEmpty}
                                label="Aspect"
                                value={selectedAspect?.value}
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
                                disabled={selectedGenes.length === 0 || isFetchingGOEnrichmentJson}
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
                        {gOEnrichmentRows.length > 0 && (
                            <GOEnrichmentControl>
                                {treeView && (
                                    <Tooltip title="View terms in a sortable grid (instead of hierarchical tree)">
                                        <Button onClick={(): void => setTreeView(false)}>
                                            Flat
                                        </Button>
                                    </Tooltip>
                                )}
                                {!treeView && (
                                    <Tooltip title="View terms in a hierarchical tree">
                                        <Button onClick={(): void => setTreeView(true)}>
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
                            isFetching={isFetchingGOEnrichmentJson}
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
                    {isFetchingGOEnrichmentJson &&
                        `Computing Gene Ontology Enrichment for ${selectedGenes.length} genes.`}
                    {/* Only display info's about enriched terms when fetching data is complete. */}
                    {isFetchingGOEnrichmentJson === false &&
                        allAspectsEmpty &&
                        'Enriched terms not found.'}
                    {isFetchingGOEnrichmentJson === false &&
                        !allAspectsEmpty &&
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

export default connector(GOEnrichment);
