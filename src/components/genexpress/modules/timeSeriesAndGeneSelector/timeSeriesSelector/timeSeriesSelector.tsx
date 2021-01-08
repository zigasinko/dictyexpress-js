import React, { ReactElement } from 'react';
import DictyGrid, { DictyGridProps } from 'components/genexpress/common/dictyGrid/dictyGrid';
import { Relation } from '@genialis/resolwe/dist/api/types/rest';
import { TimeSeriesSelectorContainer } from './timeSeriesSelector.styles';

const columnDefs = [
    { field: 'id', headerName: 'Id', width: 20 },
    { field: 'collection.name', headerName: 'Name' },
];

const multipleSelectionColumnDefs = [
    {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        width: 25,
    },
    { field: 'id', headerName: 'Id', width: 20 },
    { field: 'collection.name', headerName: 'Name' },
];

type TimeSeriesSelectorProps = {
    timeSeries: Relation[];
    selectedTimeSeries: Relation[];
    selectionMode?: DictyGridProps<Relation>['selectionMode'];
    onRowSelected?: DictyGridProps<Relation>['onRowSelected'];
    onSelectionChanged?: DictyGridProps<Relation>['onSelectionChanged'];
    isFetching?: boolean;
};

const TimeSeriesSelector = ({
    timeSeries,
    selectedTimeSeries,
    selectionMode = 'single',
    onRowSelected,
    onSelectionChanged,
    isFetching,
}: TimeSeriesSelectorProps): ReactElement => {
    return (
        <TimeSeriesSelectorContainer>
            <DictyGrid
                isFetching={isFetching}
                data={timeSeries}
                selectionMode={selectionMode}
                filterLabel="Filter time series"
                columnDefs={selectionMode === 'multiple' ? multipleSelectionColumnDefs : columnDefs}
                getRowId={(data): string => data.id.toString()}
                onRowSelected={onRowSelected}
                onSelectionChanged={onSelectionChanged}
                selectedData={selectedTimeSeries.length > 0 ? selectedTimeSeries : undefined}
            />
        </TimeSeriesSelectorContainer>
    );
};

export default TimeSeriesSelector;
