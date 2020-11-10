import React, { ReactElement, useRef } from 'react';
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
import { fetchTimeSeries } from 'redux/epics/epicsActions';
import useReport from 'components/genexpress/common/reportBuilder/useReport';
import { objectsArrayToTsv } from 'utils/reportUtils';
import GeneSelector from './geneSelector/geneSelector/geneSelector';
import { TimeSeriesGridWrapper } from './timeSeriesAndGeneSelector.styles';

export const moduleKey = 'timeSeriesAndGeneSelector';

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
    useReport(
        (processFile) => {
            processFile(
                'Collection/selectedCollection.tsv',
                selectedTimeSeries != null
                    ? objectsArrayToTsv([
                          {
                              id: selectedTimeSeries.id,
                              created: selectedTimeSeries.created,
                              modified: selectedTimeSeries.modified,
                              name: selectedTimeSeries.collection.name,
                              contributor_username: selectedTimeSeries.contributor.username,
                          },
                      ])
                    : '',
                false,
            );
        },
        [selectedTimeSeries],
    );

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

    /* debugger;
    const [updatableDataDefinitions, setUpdatableDataDefinitions] = useState<string>(() => {
        debugger;
        return 'asdf';
    }); */

    const columnDefs = useRef([
        { field: 'id', headerName: 'Id', width: 20 },
        { field: 'collection.name', headerName: 'Name', width: 50 },
    ]);

    return (
        <TimeSeriesGridWrapper>
            <DictyGrid
                onReady={onGridReady}
                isFetching={isFetching}
                data={timeSeries}
                selectionMode="single"
                filterLabel="Filter time series"
                columnDefs={columnDefs.current}
                getRowId={(data): string => data.id.toString()}
                onRowSelected={onRowSelectedHandler}
                selectedData={selectedTimeSeries != null ? [selectedTimeSeries] : undefined}
            />
            <GeneSelector />
        </TimeSeriesGridWrapper>
    );
};

export default connector(TimeSeriesAndGeneSelector);
