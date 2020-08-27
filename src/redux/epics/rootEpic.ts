import { combineEpics } from 'redux-observable';
import {
    fetchTimeSeriesSamplesExpressionsEpic,
    timeSeriesSelectedEpic,
    fetchTimeSeriesEpic,
} from './timeSeriesEpics';

const rootEpic = combineEpics(
    fetchTimeSeriesSamplesExpressionsEpic,
    timeSeriesSelectedEpic,
    fetchTimeSeriesEpic,
);

export default rootEpic;
