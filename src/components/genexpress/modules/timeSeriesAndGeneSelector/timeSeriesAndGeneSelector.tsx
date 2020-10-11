import React, { ReactElement } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from 'redux/rootReducer';
import {
    getTimeSeries,
    getTimeSeriesIsFetching,
    getSelectedTimeSeries,
    timeSeriesSelected,
} from 'redux/stores/timeSeries';
import DictyGrid from 'components/genexpress/common/dictyGrid/dictyGrid';
import { Relation } from '@genialis/resolwe/dist/api/types/rest';
import { fetchTimeSeries } from 'redux/epics/timeSeriesEpics';
import GeneSelector from './geneSelector/geneSelector/geneSelector';
import { TimeSeriesGridWrapper } from './timeSeriesAndGeneSelector.styles';

const mapStateToProps = (
    state: RootState,
): { timeSeries: Relation[]; selectedTimeSeries: Relation; isFetching: boolean } => {
    return {
        timeSeries: getTimeSeries(state.timeSeries),
        selectedTimeSeries: getSelectedTimeSeries(state.timeSeries),
        isFetching: getTimeSeriesIsFetching(state.timeSeries),
    };
};

const connector = connect(mapStateToProps, {
    connectedFetchTimeSeries: fetchTimeSeries,
    connectedTimeSeriesSelected: timeSeriesSelected,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

const TimeSeriesAndGeneSelector = ({
    connectedFetchTimeSeries,
    timeSeries,
    selectedTimeSeries,
    isFetching,
    connectedTimeSeriesSelected,
}: PropsFromRedux): ReactElement => {
    const onRowSelectedHandler = (newSelectedTimeSeries: Relation): void => {
        if (selectedTimeSeries == null || newSelectedTimeSeries.id !== selectedTimeSeries.id) {
            connectedTimeSeriesSelected(newSelectedTimeSeries.id);
        }
    };

    const onGridReady = (): void => {
        if (timeSeries.length === 0) {
            connectedFetchTimeSeries();
        }
    };

    return (
        <TimeSeriesGridWrapper>
            <DictyGrid
                onReady={onGridReady}
                isFetching={isFetching}
                data={timeSeries}
                selectionMode="single"
                filterLabel="Filter time series"
                columnDefs={[
                    { field: 'id', headerName: 'Id', width: 20 },
                    { field: 'collection.name', headerName: 'Name', width: 50 },
                ]}
                getRowId={(data): string => data.id.toString()}
                onRowSelected={onRowSelectedHandler}
                selectedData={selectedTimeSeries != null ? [selectedTimeSeries] : undefined}
            />
            <GeneSelector />
        </TimeSeriesGridWrapper>
    );
};

export default connector(TimeSeriesAndGeneSelector);
