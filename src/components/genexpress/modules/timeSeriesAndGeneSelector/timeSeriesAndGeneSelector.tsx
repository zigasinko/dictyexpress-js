import React, { ReactElement } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Relation } from '@genialis/resolwe/dist/api/types/rest';
import { RootState } from '../../../../redux/rootReducer';
import { selectTimeSeries, fetchTimeSeries } from '../../../../redux/thunks/timeSeriesThunks';
import { getTimeSeries, getIsFetching } from '../../../../redux/stores/timeSeries';
import GeneSelector from './geneSelector/geneSelector/geneSelector';
import DictyGrid from '../../common/dictyGrid/dictyGrid';
import { TimeSeriesGridWrapper } from './timeSeriesAndGeneSelector.styles';

const mapStateToProps = (state: RootState): { timeSeries: Relation[]; isFetching: boolean } => {
    return {
        timeSeries: getTimeSeries(state.timeSeries),
        isFetching: getIsFetching(state.timeSeries),
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
    const timeSeriesSelectedHandler = (selectedTimeSeries: Relation): void => {
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
                onRowSelected={timeSeriesSelectedHandler}
            />
            <GeneSelector />
        </TimeSeriesGridWrapper>
    );
};

export default connector(TimeSeriesAndGeneSelector);
