import React, { ReactElement } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import TimeSeriesAndGeneSelector from './modules/timeSeriesAndGeneSelector/timeSeriesAndGeneSelector';
import DictyModule from './common/dictyModule/dictyModule';

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
const GeneExpressGrid = (): ReactElement => {
    return (
        <>
            <ResponsiveGridLayout
                className="layout"
                draggableHandle=".dragHandle"
                layouts={defaultLayout}
                verticalCompact
                breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                cols={{ lg: 12, md: 10, sm: 6 }}
            >
                <div key="timeSeriesAndGeneSelector">
                    <DictyModule title="Time series and Gene Selection">
                        <TimeSeriesAndGeneSelector />
                    </DictyModule>
                </div>
                <div key="secondModule">
                    <DictyModule title="Expression Time Courses">
                        <span>Expression Time Courses</span>
                    </DictyModule>
                </div>
            </ResponsiveGridLayout>
        </>
    );
};

export default GeneExpressGrid;
