import React, { ReactElement } from 'react';
import DictyGrid from 'components/genexpress/common/dictyGrid/dictyGrid';
import { Relation } from '@genialis/resolwe/dist/api/types/rest';
import { TimeSeriesSelectorContainer } from './timeSeriesSelector.styles';

const columnDefs = [
    { field: 'id', headerName: 'Id', width: 20 },
    { field: 'collection.name', headerName: 'Name' },
];

type TimeSeriesSelectorProps = {
    timeSeries: Relation[];
    selectedTimeSeries: Relation[];
    onRowSelected: (newSelectedTimeSeries: Relation) => void;
    isFetching?: boolean;
};

const TimeSeriesSelector = ({
    timeSeries,
    selectedTimeSeries,
    onRowSelected,
    isFetching,
}: TimeSeriesSelectorProps): ReactElement => {
    return (
        <TimeSeriesSelectorContainer>
            <DictyGrid
                isFetching={isFetching}
                data={timeSeries}
                selectionMode="single"
                filterLabel="Filter time series"
                columnDefs={columnDefs}
                getRowId={(data): string => data.id.toString()}
                onRowSelected={onRowSelected}
                selectedData={selectedTimeSeries.length > 0 ? selectedTimeSeries : undefined}
            />
        </TimeSeriesSelectorContainer>
    );
};

export default TimeSeriesSelector;
