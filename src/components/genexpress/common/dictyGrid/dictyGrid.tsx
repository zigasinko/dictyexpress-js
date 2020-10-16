import { AgGridReact } from 'ag-grid-react';
import React, { ReactElement, useEffect, useState, useRef, useCallback } from 'react';
import {
    GridApi,
    RowSelectedEvent,
    GridReadyEvent,
    ColumnApi,
    ColDef,
    SelectionChangedEvent,
    RowClickedEvent,
    SortChangedEvent,
} from 'ag-grid-community';
import _ from 'lodash';
import { DictyGridContainer, FilterTextField, GridWrapper } from './dictyGrid.styles';

type DictyGridProps<T> = {
    hideFilter?: boolean;
    filterLabel?: string;
    data: T[];
    selectedData?: T[];
    isFetching?: boolean;
    columnDefs: ColDef[];
    autoGroupColumnDef?: ColDef;
    selectionMode?: 'single' | 'multiple';
    treeData?: boolean;
    suppressRowClickSelection?: boolean;
    getRowId: (data: T) => string;
    onReady?: () => void;
    onRowClicked?: (itemData: T) => void;
    onRowSelected?: (itemData: T) => void;
    onSelectionChanged?: (selectedItemsData: T[]) => void;
    onSortChanged?: (event: SortChangedEvent) => void;
    getDataPath?: (itemData: T) => string[];
};

const DictyGrid = <T extends {}>({
    data,
    selectedData,
    isFetching,
    hideFilter = false,
    filterLabel,
    columnDefs,
    autoGroupColumnDef,
    selectionMode,
    treeData = false,
    suppressRowClickSelection = false,
    getRowId,
    onReady,
    onRowClicked,
    onRowSelected,
    onSelectionChanged,
    onSortChanged,
    getDataPath,
}: DictyGridProps<T>): ReactElement => {
    const [filter, setFilter] = useState<string>('');
    const gridApi = useRef<GridApi | null>(null);
    const columnApi = useRef<ColumnApi | null>(null);

    const setOverlay = useCallback(() => {
        if (isFetching) {
            gridApi.current?.showLoadingOverlay();
        } else if (data.length === 0) {
            gridApi.current?.showNoRowsOverlay();
        } else {
            gridApi.current?.hideOverlay();
        }
    }, [data.length, isFetching]);

    useEffect(() => {
        setOverlay();
    }, [setOverlay]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setFilter(e.target.value);
    };

    // Destroy grid after component is unmounted.
    useEffect(() => {
        return (): void => {
            gridApi.current?.destroy();
        };
    }, []);

    // Execute onRowSelected callback with selected data.
    const handleRowSelected = (event: RowSelectedEvent): void => {
        if (event.node.isSelected()) {
            onRowSelected?.(event.node.data);
        }
    };

    // If any value is already selected, it needs to be manually set as selected or else grid won't show it.
    const setSelectedData = (dataToSelect: T[] | undefined): void => {
        if (_.isEmpty(dataToSelect) || dataToSelect == null) {
            return;
        }

        const selectedDataIds = dataToSelect.map(getRowId);
        gridApi.current?.forEachNode((node) => {
            if (selectedDataIds?.includes(getRowId(node.data))) {
                node.setSelected(true);
            }
        });
    };

    const handleOnGridReady = (params: GridReadyEvent): void => {
        gridApi.current = params.api;
        columnApi.current = params.columnApi;
        gridApi.current?.sizeColumnsToFit();
        setOverlay();

        setSelectedData(selectedData);

        onReady?.();
    };

    const defaultColDef = {
        flex: 1,
        resizable: true,
        sortable: true,
    };

    const handleOnColumnResized = (): void => {
        gridApi.current?.resetRowHeights();
    };

    const handleOnSelectionChanged = (event: SelectionChangedEvent): void => {
        onSelectionChanged?.(event.api.getSelectedNodes().map((selectedNode) => selectedNode.data));
    };

    const handleOnRowClicked = (event: RowClickedEvent): void => {
        onRowClicked?.(event.node.data);
    };

    const handleOnSortChanged = (event: SortChangedEvent): void => {
        onSortChanged?.(event);
    };

    const handleOnGridSizeChanged = (): void => {
        gridApi.current?.sizeColumnsToFit();
    };

    return (
        <DictyGridContainer id={`dictyGrid${treeData}`}>
            {!hideFilter && (
                <FilterTextField
                    id="filterField"
                    variant="outlined"
                    label={filterLabel}
                    color="secondary"
                    size="small"
                    onChange={handleFilterChange}
                    value={filter}
                />
            )}

            <GridWrapper className="ag-theme-balham">
                <AgGridReact
                    // ag-grid only acknowledges treeData flag in initialization,
                    // that's why it needs to be re-mounted each time treeData flag changes
                    // -> done be React because the key is different.
                    key={`treeView${treeData}`}
                    onGridReady={handleOnGridReady}
                    onGridSizeChanged={handleOnGridSizeChanged}
                    defaultColDef={defaultColDef}
                    animateRows
                    groupDefaultExpanded={-1}
                    enableCellChangeFlash
                    onSortChanged={handleOnSortChanged}
                    columnDefs={columnDefs}
                    autoGroupColumnDef={autoGroupColumnDef}
                    disableStaticMarkup={false}
                    rowSelection={selectionMode}
                    rowStyle={
                        selectionMode != null || handleOnRowClicked != null
                            ? { cursor: 'pointer' }
                            : {}
                    }
                    suppressRowClickSelection={suppressRowClickSelection}
                    onRowClicked={handleOnRowClicked}
                    onRowSelected={handleRowSelected}
                    getRowNodeId={getRowId}
                    immutableData
                    treeData={treeData}
                    onSelectionChanged={handleOnSelectionChanged}
                    rowData={data}
                    quickFilterText={filter}
                    onColumnResized={handleOnColumnResized}
                    getDataPath={getDataPath}
                />
            </GridWrapper>
        </DictyGridContainer>
    );
};

export default DictyGrid;
