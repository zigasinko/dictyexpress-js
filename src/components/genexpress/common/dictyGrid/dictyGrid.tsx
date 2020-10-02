import { AgGridReact } from 'ag-grid-react';
import React, { ReactElement, useEffect, useState, useRef } from 'react';
import {
    GridApi,
    RowSelectedEvent,
    GridReadyEvent,
    ColumnApi,
    ColDef,
    SelectionChangedEvent,
    RowClickedEvent,
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
    selectionMode?: 'single' | 'multiple';
    suppressRowClickSelection?: boolean;
    getRowId: (data: T) => string;
    onReady?: () => void;
    onRowClicked?: (itemData: T) => void;
    onRowSelected?: (itemData: T) => void;
    onSelectionChanged?: (selectedItemsData: T[]) => void;
};

const DictyGrid = <T extends {}>({
    data,
    selectedData,
    isFetching,
    hideFilter = false,
    filterLabel,
    columnDefs,
    selectionMode,
    suppressRowClickSelection = false,
    getRowId,
    onReady,
    onRowClicked,
    onRowSelected,
    onSelectionChanged,
}: DictyGridProps<T>): ReactElement => {
    const [filter, setFilter] = useState<string>('');
    const gridApi = useRef<GridApi | null>(null);
    const columnApi = useRef<ColumnApi | null>(null);
    const gridElement = useRef<AgGridReact>(null);

    useEffect(() => {
        if (isFetching) {
            gridApi.current?.showLoadingOverlay();
        } else if (data.length === 0) {
            gridApi.current?.showNoRowsOverlay();
        } else {
            gridApi.current?.hideOverlay();
        }
    }, [data.length, isFetching]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setFilter(e.target.value);
    };

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
        gridApi.current?.hideOverlay();
        gridApi.current?.sizeColumnsToFit();

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

    return (
        <DictyGridContainer>
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
                    data-testid="agGrid"
                    ref={gridElement}
                    onGridReady={handleOnGridReady}
                    defaultColDef={defaultColDef}
                    columnDefs={columnDefs}
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
                    onSelectionChanged={handleOnSelectionChanged}
                    rowData={data}
                    quickFilterText={filter}
                    onColumnResized={handleOnColumnResized}
                />
            </GridWrapper>
        </DictyGridContainer>
    );
};

export default DictyGrid;
