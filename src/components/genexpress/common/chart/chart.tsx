import React, { ReactElement, useRef, useEffect, useCallback, useContext } from 'react';
import * as vega from 'vega';
import * as vegaTooltip from 'vega-tooltip';
import { withSize, SizeMeProps } from 'react-sizeme';
import { Spec } from 'vega';
import { useDispatch } from 'react-redux';
import { handleError } from 'utils/errorUtils';
import { RendererContext } from 'components/common/rendererContext';
import { vegaTheme } from '../theming/vegaTheme';
import useUpdateEffect from '../useUpdateEffect';

export type DataHandler = {
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (name: string, value: any) => void;
};

export type DataDefinition = {
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Array<any>;
};

export type SignalDefinition = {
    name: string;
    value: unknown;
};

type ChartProps = {
    updatableDataDefinitions?: Array<DataDefinition>;
    updatableSignalDefinitions?: Array<SignalDefinition>;
    dataHandlers?: Array<DataHandler>;
    vegaSpecification: Spec;
} & SizeMeProps;

const chartPadding = { top: 20, left: 15, bottom: 15, right: 15 };

/**
 * Chart component is the basis for all charts that want to use Vega charting library.
 *
 * For performance reasons, chart will get reinitialized only if vegaSpecification changes.
 * All other updates are handled with API calls (set data -> run). That's why we must pass
 * updatableDataDefinitions for each data that can get updated.
 *
 * Add all data handlers (that execute after data object changes) via 'dataHandlers'
 * variable. All handlers will be automatically removed after view is removed from DOM.
 *
 * Setting `renderer` to 'svg' will help with debugging, because it's more descriptive.
 */
const Chart = ({
    updatableDataDefinitions,
    updatableSignalDefinitions,
    dataHandlers,
    size: { width, height },
    vegaSpecification,
}: ChartProps): ReactElement => {
    const dispatch = useDispatch();
    const renderer = useContext(RendererContext);

    const addedDataHandlers = useRef<Array<DataHandler>>([]);

    // Element with the chart.
    const chartElement = useRef<HTMLDivElement>(null);
    const chartView = useRef<vega.View>();

    /**
     * Retrieve width of chart element (chart container div).
     */
    const getChartElementWidth = useCallback((): number => {
        if (!chartElement.current) {
            return 0;
        }

        return chartElement.current.clientWidth;
    }, []);

    /**
     * Retrieve height of chart element (chart container div).
     */
    const getChartElementHeight = useCallback((): number => {
        if (!chartElement.current) {
            return 0;
        }

        return chartElement.current.clientHeight;
    }, []);

    /**
     * Vega runAsync evaluates the underlying dataflow graph and returns a Promise that
     * resolves upon completion of dataflow processing and scenegraph rendering.
     */
    const runChart = useCallback((): void => {
        try {
            chartView.current?.runAsync();
        } catch (error) {
            dispatch(handleError('Error generating chart.', error));
        }
    }, [dispatch]);

    /**
     * Set chart width and height via Vega API.
     */
    const resizeChart = useCallback((): void => {
        chartView.current?.width(getChartElementWidth());
        chartView.current?.height(getChartElementHeight());

        runChart();
    }, [getChartElementHeight, getChartElementWidth, runChart]);

    /**
     * Resize on parent element width / height change.
     */
    useUpdateEffect(() => {
        resizeChart();
    }, [width, height, resizeChart]);

    /**
     * Initialize the actual chart via Vega JS API.
     */
    useEffect((): undefined | (() => void) => {
        const defaultSpecification: vega.Spec = {
            width: getChartElementWidth(),
            height: getChartElementHeight(),
            padding: chartPadding,
            autosize: {
                type: 'fit',
                contains: 'padding',
            },
            signals: [],
            data: [],
            legends: [],
            marks: [],
            scales: [],
            axes: [],
        };
        const renderSpecification = { ...defaultSpecification, ...vegaSpecification };

        const generateChart = (): void => {
            chartView.current = new vega.View(vega.parse(renderSpecification, vegaTheme), {
                renderer,
                container: chartElement.current != null ? chartElement.current : undefined,
            });

            const tooltipHandler = new vegaTooltip.Handler({});
            chartView.current.tooltip(tooltipHandler.call);

            runChart();
        };

        generateChart();

        // Vega Cleanup.
        return (): void => {
            // Unregister any timers and remove any event listeners the visualization has
            // registered on external DOM elements.
            chartView.current?.finalize();
        };
    }, [getChartElementHeight, getChartElementWidth, renderer, runChart, vegaSpecification]);

    /**
     * Manage data handlers.
     */
    useEffect(() => {
        if (dataHandlers != null && chartView.current != null) {
            // If any handlers are already attached, first remove them all.
            for (let i = 0; i < addedDataHandlers.current.length; i += 1) {
                const addedDataHandler = addedDataHandlers.current[i];
                chartView.current.removeDataListener(
                    addedDataHandler.name,
                    addedDataHandler.handler,
                );
            }

            // Add new handlers.
            for (let i = 0; i < dataHandlers.length; i += 1) {
                const newDataHandler = dataHandlers[i];
                chartView.current.addDataListener(newDataHandler.name, newDataHandler.handler);
            }

            addedDataHandlers.current = dataHandlers;
        }
    }, [dataHandlers]);

    /**
     * Update chart data when updatableDataDefinitions (data) changes.
     */
    useEffect(() => {
        if (updatableDataDefinitions != null) {
            updatableDataDefinitions.forEach((dataDefinition) => {
                chartView.current?.data(dataDefinition.name, dataDefinition.data);
            });

            runChart();
        }
    }, [updatableDataDefinitions, runChart]);

    /**
     * Update chart data when updatableSignalDefinitions (value) changes.
     */
    useEffect(() => {
        if (updatableSignalDefinitions != null) {
            updatableSignalDefinitions.forEach((signalDefinition) => {
                chartView.current?.signal(signalDefinition.name, signalDefinition.value);
            });

            runChart();
        }
    }, [updatableSignalDefinitions, runChart]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <div id="view" style={{ width: '100%', height: '100%' }} ref={chartElement} />
        </div>
    );
};

export default withSize({
    monitorHeight: true,
    monitorWidth: true,
    refreshRate: 100,
    refreshMode: 'debounce',
})(Chart);
