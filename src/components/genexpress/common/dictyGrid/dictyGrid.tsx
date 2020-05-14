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

import { FilterTextField, GridWrapper } from './dictyGrid.styles';

type Props<T> = {
    hideFilter?: boolean;
    filterLabel?: string;
    data: T[];
    isFetching?: boolean;
    columnDefs: ColDef[];
    selectionMode?: 'single' | 'multiple';
    suppressRowClickSelection?: boolean;
    onReady?: () => void;
    onRowClicked?: (itemData: T) => void;
    onRowSelected?: (itemData: T) => void;
    onSelectionChanged?: (selectedItemsDatas: T[]) => void;
};

const DictyGrid = <T extends {}>({
    data,
    isFetching,
    hideFilter = false,
    filterLabel,
    columnDefs,
    selectionMode,
    suppressRowClickSelection = false,
    onReady,
    onRowClicked,
    onRowSelected,
    onSelectionChanged,
}: Props<T>): ReactElement => {
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

    // Set selected so that grid knows which row to mark as "selected" and execute onRowSelected callback.
    const handleRowSelected = (event: RowSelectedEvent): void => {
        // TODO: maybe it's better to return the whole object, not just id!
        if (event.node.isSelected()) {
            onRowSelected?.(event.node.data);
        }
    };

    const handleOnGridReady = (params: GridReadyEvent): void => {
        gridApi.current = params.api;
        columnApi.current = params.columnApi;
        gridApi.current?.hideOverlay();
        gridApi.current?.sizeColumnsToFit();
        onReady?.();
    };

    const defaultColDef = {
        flex: 1,
        resizable: true,
        sortable: true,
    };

    const onColumnResized = (): void => {
        gridApi.current?.resetRowHeights();
    };

    const handleSelectionChanged = (event: SelectionChangedEvent): void => {
        onSelectionChanged?.(event.api.getSelectedNodes().map((selectedNode) => selectedNode.data));
    };
    const handleRowClicked = (event: RowClickedEvent): void => {
        onRowClicked?.(event.node.data);
    };

    return (
        <>
            {!hideFilter && (
                <FilterTextField
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
                    ref={gridElement}
                    onGridReady={handleOnGridReady}
                    defaultColDef={defaultColDef}
                    columnDefs={columnDefs}
                    disableStaticMarkup={false}
                    rowSelection={selectionMode}
                    rowStyle={
                        selectionMode != null || handleRowClicked != null
                            ? { cursor: 'pointer' }
                            : {}
                    }
                    suppressRowClickSelection={suppressRowClickSelection}
                    onRowClicked={handleRowClicked}
                    onRowSelected={handleRowSelected}
                    onSelectionChanged={handleSelectionChanged}
                    rowData={data}
                    quickFilterText={filter}
                    onColumnResized={onColumnResized}
                />
            </GridWrapper>
        </>
    );
};

export default DictyGrid;
