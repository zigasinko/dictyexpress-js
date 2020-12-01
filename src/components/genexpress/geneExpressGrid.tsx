import React, { ReactElement, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { connect, ConnectedProps, useDispatch } from 'react-redux';
import { RootState } from 'redux/rootReducer';
import { getTimeSeriesIsFetching, getIsAddingToBasket } from 'redux/stores/timeSeries';
import { getIsFetchingSamplesExpressions } from 'redux/stores/samplesExpressions';
import { appStarted } from 'redux/epics/connectToServerEpic';
import csrfApi from 'api/csrfApi';
import { getIsLoggingOut } from 'redux/stores/authentication';
import TimeSeriesAndGeneSelector from './modules/timeSeriesAndGeneSelector/timeSeriesAndGeneSelector';
import GeneExpressions from './modules/geneExpressions/geneExpressions';
import DictyModule from './common/dictyModule/dictyModule';
import SnackbarNotifier from './snackbarNotifier/snackbarNotifier';
import GenexpressAppBar from './genexpressAppBar/genexpressAppBar';

const ResponsiveGridLayout = WidthProvider(Responsive);
const defaultLayout = {
    lg: [
        {
            i: 'timeSeriesAndGeneSelector',
            x: 1,
            y: 1,
            w: 4,
            h: 4,
            minW: 2,
            minH: 3,
        },
        {
            i: 'secondModule',
            x: 6,
            y: 1,
            w: 4,
            h: 4,
            minW: 2,
            minH: 3,
        },
    ],
    md: [
        {
            i: 'timeSeriesAndGeneSelector',
            x: 1,
            y: 1,
            w: 4,
            h: 4,
            minW: 2,
            minH: 3,
        },
        {
            i: 'secondModule',
            x: 5,
            y: 1,
            w: 4,
            h: 4,
            minW: 2,
            minH: 3,
        },
    ],
    sm: [
        {
            i: 'timeSeriesAndGeneSelector',
            x: 0,
            y: 1,
            w: 6,
            h: 4,
            minW: 2,
            minH: 3,
        },
        {
            i: 'secondModule',
            x: 5,
            y: 1,
            w: 6,
            h: 4,
            minW: 2,
            minH: 3,
        },
    ],
};

const mapStateToProps = (
    state: RootState,
): {
    isFetchingTimeSeries: boolean;
    isAddingToBasket: boolean;
    isFetchingSamplesExpressions: boolean;
    isLoggingOut: boolean;
} => {
    return {
        isFetchingTimeSeries: getTimeSeriesIsFetching(state.timeSeries),
        isAddingToBasket: getIsAddingToBasket(state.timeSeries),
        isFetchingSamplesExpressions: getIsFetchingSamplesExpressions(state.samplesExpressions),
        isLoggingOut: getIsLoggingOut(state.authentication),
    };
};

const connector = connect(mapStateToProps, {});

type PropsFromRedux = ConnectedProps<typeof connector>;

const GeneExpressGrid = ({
    isFetchingTimeSeries,
    isAddingToBasket,
    isFetchingSamplesExpressions,
    isLoggingOut,
}: PropsFromRedux): ReactElement => {
    const dispatch = useDispatch();

    // This page is the entry point for geneExpress. Handle app initialization here.
    useEffect(() => {
        // CSRF cookie has to be obtained in order to send any request to API.
        csrfApi.getCSRFCookie();

        // Indicate that the app has started -> initialize WebSocket connection and
        dispatch(appStarted());
    }, [dispatch]);

    return (
        <>
            <GenexpressAppBar isLoading={isLoggingOut} />
            <SnackbarNotifier />
            <ResponsiveGridLayout
                className="layout"
                draggableHandle=".dragHandle"
                layouts={defaultLayout}
                verticalCompact
                breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                cols={{ lg: 12, md: 10, sm: 6 }}
            >
                <div key="timeSeriesAndGeneSelector">
                    <DictyModule
                        title="Time series and Gene Selection"
                        isLoading={isFetchingTimeSeries || isAddingToBasket}
                    >
                        <TimeSeriesAndGeneSelector />
                    </DictyModule>
                </div>
                <div key="secondModule">
                    <DictyModule
                        title="Expression Time Courses"
                        isLoading={isFetchingSamplesExpressions}
                    >
                        <GeneExpressions />
                    </DictyModule>
                </div>
            </ResponsiveGridLayout>
        </>
    );
};

export default connector(GeneExpressGrid);
