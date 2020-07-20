import { AgGridReact } from 'ag-grid-react';
import React, { ReactElement, useEffect, useState, useRef } from 'react';
import { GridApi, RowSelectedEvent, GridReadyEvent, ColumnApi, ColDef } from 'ag-grid-community';
import { GridWrapper, FilterTextField } from './dictyGrid.styles';

type Props<T extends { id: number | string }> = {
    showFilter?: boolean;
    filterLabel?: string;
    data: T[];
    isFetching: boolean;
    columnDefinitions: ColDef[];
    onReady: () => void;
    onRowSelected: (id: number | string) => void;
};

const DictyGrid = <T extends { id: number | string }>({
    data,
    isFetching,
    showFilter = true,
    filterLabel,
    columnDefinitions,
    onReady,
    onRowSelected,
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
            onRowSelected(event.node.data.id);
        }
    };

    const handleOnGridReady = (params: GridReadyEvent): void => {
        gridApi.current = params.api;
        columnApi.current = params.columnApi;
        gridApi.current?.hideOverlay();
        gridApi.current?.sizeColumnsToFit();
        onReady();
    };

    return (
        <>
            {showFilter && (
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
                    columnDefs={columnDefinitions}
                    rowSelection="single"
                    onRowSelected={handleRowSelected}
                    rowData={data}
                    quickFilterText={filter}
                />
            </GridWrapper>
        </>
    );
};

export default DictyGrid;
