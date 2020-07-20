import React, { ReactElement } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Relation } from '@genialis/resolwe/dist/api/types/rest';
import { RootState } from '../../../../redux/rootReducer';
import { selectTimeSeries, fetchTimeSeries } from '../../../../redux/thunks/timeSeriesThunks';
import { getTimeSeries, getIsFetching } from '../../../../redux/stores/timeSeries';
import GeneSelector from './geneSelector/geneSelector/geneSelector';
import DictyGrid from '../../common/dictyGrid/dictyGrid';

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
    const timeSeriesSelectedHandler = (id: number | string): void => {
        connectedSelectTimeSeries(id as number);
    };

    const onGridReady = (): void => {
        connectedFetchTimeSeries();
    };

    return (
        <>
            <DictyGrid
                onReady={onGridReady}
                isFetching={isFetching}
                data={timeSeries}
                filterLabel="Filter time series"
                columnDefinitions={[
                    { field: 'id', headerName: 'Id', width: 20 },
                    { field: 'collection.name', headerName: 'Name', width: 50 },
                ]}
                onRowSelected={timeSeriesSelectedHandler}
            />
            <GeneSelector />
        </>
    );
};

export default connector(TimeSeriesAndGeneSelector);
