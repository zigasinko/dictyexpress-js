import React, { ChangeEvent, ReactElement, useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from 'redux/rootReducer';
import { genesHighlighted, getSelectedGenes } from 'redux/stores/genes';
import { Button, MenuItem, Tooltip } from '@material-ui/core';
import {
    getGOEnrichmentJson,
    getIsFetchingGOEnrichmentJson,
    getPValueThreshold,
    pValueThresholdChanged,
} from 'redux/stores/gOEnrichment';
import { Aspect, Gene, GOEnrichmentRow } from 'redux/models/internal';
import { GOEnrichmentJson } from '@genialis/resolwe/dist/api/types/rest';
import _ from 'lodash';
import DictySelect from 'components/genexpress/common/dictySelect/dictySelect';
import { formatNumber } from 'utils/math';
import {
    Grid,
    Table,
    TableColumnResizing,
    TableHeaderRow,
    TableTreeColumn,
} from '@devexpress/dx-react-grid-material-ui';
import {
    CustomTreeData,
    DataTypeProvider,
    IntegratedSorting,
    SortingState,
    TreeDataState,
} from '@devexpress/dx-react-grid';
import {
    GOEnrichmentContainer,
    GOEnrichmentControl,
    GOEnrichmentControls,
    GOEnrichmentGridContainer,
} from './gOEnrichment.styles';
import GOEnrichmentAssociationsModal from './gOEnrichmentAssociationsModal/gOEnrichmentAssociationsModal';
import GOEnrichmentScoreCellDevExpress from './gOEnrichmentScoreCellDevExpress/gOEnrichmentScoreCellDevExpress';

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
});

type PropsFromRedux = ConnectedProps<typeof connector>;

const aspectOptions: Aspect[] = [
    { value: 'BP', label: 'Biological process' },
    { value: 'CC', label: 'Cellular component' },
    { value: 'MF', label: 'Molecular function' },
];

const pValueThresholdsOptions = [0.1, 0.05, 0.01, 0.001, 0.0001];

const GOEnrichmentDevExpress = ({
    gOEnrichmentJson,
    pValueThreshold,
    selectedGenes,
    connectedPValueThresholdChanged,
    isFetchingGOEnrichmentJson,
}: PropsFromRedux): ReactElement => {
    const [selectedAspect, setSelectedAspect] = useState(aspectOptions[0]);
    const [gOEnrichmentRows, setGOEnrichmentRows] = useState<GOEnrichmentRow[]>([]);
    const [allAspectsEmpty, setAllAspectsEmpty] = useState<boolean>();
    const [treeView, setTreeView] = useState(true);
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

        const rows = gOEnrichmentJson.tree[selectedAspect.value] as GOEnrichmentRow[];

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
                        <Grid
                            rows={gOEnrichmentRows}
                            columns={[
                                { name: 'term_name', title: 'Term' },
                                {
                                    name: 'pval',
                                    title: 'p-value',
                                    getCellValue: (row: GOEnrichmentRow): string =>
                                        formatNumber(row.pval, 'long'),
                                },
                                { name: 'score', title: 'Score' },
                            ]}
                        >
                            <DataTypeProvider
                                for={['score']}
                                formatterComponent={GOEnrichmentScoreCellDevExpress}
                            />

                            <TreeDataState />
                            <SortingState />

                            <CustomTreeData
                                getChildRows={(
                                    currentRow: GOEnrichmentRow | null,
                                    rootRows: Array<GOEnrichmentRow>,
                                ): GOEnrichmentRow[] | null => {
                                    if (currentRow != null) {
                                        if (
                                            currentRow.children == null ||
                                            currentRow.children?.length === 0
                                        ) {
                                            return null;
                                        }

                                        return currentRow.children;
                                    }

                                    return rootRows;
                                }}
                            />

                            <IntegratedSorting />

                            <Table
                                columnExtensions={[{ columnName: 'term_name', align: 'left' }]}
                            />
                            <TableColumnResizing
                                defaultColumnWidths={[
                                    { columnName: 'term_name', width: '150' },
                                    { columnName: 'pval', width: '50' },
                                    { columnName: 'score', width: '50' },
                                ]}
                            />
                            <TableHeaderRow showSortingControls />
                            <TableTreeColumn for="term_name" />
                        </Grid>
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

export default connector(GOEnrichmentDevExpress);
