import React, { ReactElement } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from 'redux/rootReducer';
import { selectTimeSeries, fetchTimeSeries } from 'redux/thunks/timeSeriesThunks';
import {
    getTimeSeries,
    getTimeSeriesIsFetching,
    getSelectedTimeSeries,
} from 'redux/stores/timeSeries';
import DictyGrid from 'components/genexpress/common/dictyGrid/dictyGrid';
import { Relation } from '@genialis/resolwe/dist/api/types/rest';
import ConnectedGeneSelector from './geneSelector/geneSelector/geneSelector';
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
    connectedSelectTimeSeries: selectTimeSeries,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

const TimeSeriesAndGeneSelector = ({
    connectedFetchTimeSeries,
    timeSeries,
    selectedTimeSeries,
    isFetching,
    connectedSelectTimeSeries,
}: PropsFromRedux): ReactElement => {
    const onRowSelectedHandler = (newSelectedTimeSeries: Relation): void => {
        if (selectedTimeSeries == null || newSelectedTimeSeries.id !== selectedTimeSeries.id) {
            connectedSelectTimeSeries(newSelectedTimeSeries.id);
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
            <ConnectedGeneSelector />
        </TimeSeriesGridWrapper>
    );
};

export default connector(TimeSeriesAndGeneSelector);
