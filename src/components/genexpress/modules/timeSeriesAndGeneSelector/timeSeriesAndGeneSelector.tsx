import React, { ReactElement } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from 'redux/rootReducer';
import { selectTimeSeries, fetchTimeSeries } from 'redux/thunks/timeSeriesThunks';
import { getTimeSeries, getTimeSeriesIsFetching } from 'redux/stores/timeSeries';
import { Relation } from '@genialis/resolwe/dist/api/types/rest';
import DictyGrid from 'components/genexpress/common/dictyGrid/dictyGrid';
import GeneSelector from './geneSelector/geneSelector/geneSelector';
import { TimeSeriesGridWrapper } from './timeSeriesAndGeneSelector.styles';

const mapStateToProps = (state: RootState): { timeSeries: Relation[]; isFetching: boolean } => {
    return {
        timeSeries: getTimeSeries(state.timeSeries),
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
    isFetching,
    connectedSelectTimeSeries,
}: PropsFromRedux): ReactElement => {
    const onRowSelectedHandler = (selectedTimeSeries: Relation): void => {
        connectedSelectTimeSeries(selectedTimeSeries.id);
    };

    const onGridReady = (): void => {
        connectedFetchTimeSeries();
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
                onRowSelected={onRowSelectedHandler}
            />
            <GeneSelector />
        </TimeSeriesGridWrapper>
    );
};

export default connector(TimeSeriesAndGeneSelector);
