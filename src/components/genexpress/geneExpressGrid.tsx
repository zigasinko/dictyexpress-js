import { ReactElement, useEffect } from 'react';
import { Layouts, Responsive, WidthProvider } from 'react-grid-layout';
import { connect, ConnectedProps, useDispatch } from 'react-redux';
import { RootState } from 'redux/rootReducer';
import {
    getTimeSeriesIsFetching,
    getIsAddingToBasket,
    getIsFetchingGenesMappings,
} from 'redux/stores/timeSeries';
import { getIsFetchingSamplesExpressions } from 'redux/stores/samplesExpressions';
import { getIsLoggingOut } from 'redux/stores/authentication';
import {
    getIsFetchingDifferentialExpressions,
    getIsFetchingDifferentialExpressionsData,
} from 'redux/stores/differentialExpressions';
import { breakpoints } from 'components/app/globalStyle';
import { defaultBreakpointCols, getLayouts, layoutsChanged } from 'redux/stores/layouts';
import _ from 'lodash';
import { getGOEnrichmentStatus, getIsFetchingGOEnrichmentJson } from 'redux/stores/gOEnrichment';
import { appFocused, appStarted, fetchAndSelectPredefinedGenes } from 'redux/epics/epicsActions';
import { getClusteringStatus, getIsFetchingClusteringData } from 'redux/stores/clustering';
import { useLocation } from 'react-router-dom';
import { loadBookmarkedState } from 'managers/bookmarkStateManager';
import { getUrlQueryParameter } from 'utils/url';
import TimeSeriesAndGeneSelector from './modules/timeSeriesAndGeneSelector/timeSeriesAndGeneSelector';
import DictyModule from './common/dictyModule/dictyModule';
import SnackbarNotifier from './snackbarNotifier/snackbarNotifier';
import GenexpressAppBar from './genexpressAppBar/genexpressAppBar';
import DifferentialExpressions from './modules/differentialExpressions/differentialExpressions';
import GOEnrichment from './modules/gOEnrichment/gOEnrichment';
import Clustering from './modules/clustering/clustering';
import GenesExpressions from './modules/genesExpressions/genesExpressions';
import { DictyUrlQueryParameter, LayoutBreakpoint, ModulesKeys } from './common/constants';
import { ResponsiveGridLayoutContainer } from './geneExpressGrid.styles';
import useBrowserVisibility from './common/useBrowserVisibility';

const ResponsiveGridLayout = WidthProvider(Responsive);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mapStateToProps = (state: RootState) => {
    return {
        layouts: getLayouts(state.layouts),
        isFetchingTimeSeries: getTimeSeriesIsFetching(state.timeSeries),
        isAddingToBasket: getIsAddingToBasket(state.timeSeries),
        isFetchingSamplesExpressions: getIsFetchingSamplesExpressions(state.samplesExpressions),
        isFetchingGenesMappings: getIsFetchingGenesMappings(state.timeSeries),
        isFetchingDifferentialExpressions: getIsFetchingDifferentialExpressions(
            state.differentialExpressions,
        ),
        isFetchingDifferentialExpressionsData: getIsFetchingDifferentialExpressionsData(
            state.differentialExpressions,
        ),
        isLoggingOut: getIsLoggingOut(state.authentication),
        isFetchingGOEnrichmentJson: getIsFetchingGOEnrichmentJson(state.gOEnrichment),
        isFetchingClusteringData: getIsFetchingClusteringData(state.clustering),
        clusteringStatus: getClusteringStatus(state.clustering),
        gOEnrichmentStatus: getGOEnrichmentStatus(state.gOEnrichment),
    };
};

const connector = connect(mapStateToProps, {
    connectedLayoutsChanged: layoutsChanged,
    connectedFetchAndSelectPredefinedGenes: fetchAndSelectPredefinedGenes,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

const GeneExpressGrid = ({
    layouts,
    isFetchingTimeSeries,
    isAddingToBasket,
    isFetchingSamplesExpressions,
    isFetchingGenesMappings,
    isFetchingDifferentialExpressions,
    isFetchingDifferentialExpressionsData,
    isFetchingClusteringData,
    isLoggingOut,
    isFetchingGOEnrichmentJson,
    clusteringStatus,
    gOEnrichmentStatus,
    connectedLayoutsChanged,
    connectedFetchAndSelectPredefinedGenes,
}: PropsFromRedux): ReactElement => {
    const dispatch = useDispatch();
    const location = useLocation();

    // This page is the entry point for geneExpress. Handle app initialization here.
    useEffect(() => {
        dispatch(appStarted());
    }, [dispatch]);

    useBrowserVisibility({
        onShow: () => {
            dispatch(appFocused());
        },
    });

    useEffect(() => {
        const appStateId = getUrlQueryParameter(location.search, DictyUrlQueryParameter.appState);
        if (appStateId != null) {
            void loadBookmarkedState(appStateId, dispatch);
        }

        const genes = getUrlQueryParameter(location.search, DictyUrlQueryParameter.genes);
        if (genes != null && genes !== '') {
            connectedFetchAndSelectPredefinedGenes({ geneIds: genes.split(',') });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleOnLayoutChange = (
        _currentLayout: ReactGridLayout.Layout[],
        allLayouts: Layouts,
    ): void => {
        /* react-grid-layout has a bug for mutating prop on item resize:
         * https://github.com/STRML/react-grid-layout/pull/1156.
         * Thats why cloned object has to be forwarded or else immer library
         * marks it as read-only (cause it passed through the reducer)
         * -> TypeError: Cannot assign to read only property 'w' of object '#<Object>'
         */
        connectedLayoutsChanged(_.cloneDeep(allLayouts));
    };

    return (
        <>
            <GenexpressAppBar isLoading={isLoggingOut} />
            <SnackbarNotifier />
            <ResponsiveGridLayoutContainer>
                <ResponsiveGridLayout
                    className="layout"
                    draggableHandle=".dragHandle"
                    layouts={layouts}
                    verticalCompact
                    breakpoints={{
                        [LayoutBreakpoint.large]: breakpoints.large,
                        [LayoutBreakpoint.mid]: breakpoints.mid,
                        [LayoutBreakpoint.small]: breakpoints.small,
                    }}
                    cols={defaultBreakpointCols}
                    onLayoutChange={handleOnLayoutChange}
                >
                    <div key={ModulesKeys.timeSeriesAndGeneSelector}>
                        <DictyModule
                            title="Time series and Gene Selection"
                            isLoading={isFetchingTimeSeries || isAddingToBasket}
                        >
                            <TimeSeriesAndGeneSelector />
                        </DictyModule>
                    </div>
                    <div key={ModulesKeys.expressionTimeCourses}>
                        <DictyModule
                            title="Expression Time Courses"
                            isLoading={isFetchingSamplesExpressions || isFetchingGenesMappings}
                        >
                            <GenesExpressions />
                        </DictyModule>
                    </div>
                    <div key={ModulesKeys.differentialExpressions}>
                        <DictyModule
                            title="Differential expressions"
                            isLoading={
                                isFetchingDifferentialExpressions ||
                                isFetchingDifferentialExpressionsData
                            }
                        >
                            <DifferentialExpressions />
                        </DictyModule>
                    </div>
                    <div key={ModulesKeys.gOEnrichment}>
                        <DictyModule
                            title="Gene Ontology Enrichment"
                            isLoading={isFetchingGOEnrichmentJson}
                            status={gOEnrichmentStatus}
                        >
                            <GOEnrichment />
                        </DictyModule>
                    </div>
                    <div key={ModulesKeys.clustering}>
                        <DictyModule
                            title="Hierarchical Clustering"
                            isLoading={isFetchingClusteringData}
                            status={clusteringStatus}
                        >
                            <Clustering />
                        </DictyModule>
                    </div>
                </ResponsiveGridLayout>
            </ResponsiveGridLayoutContainer>
        </>
    );
};

export default connector(GeneExpressGrid);
