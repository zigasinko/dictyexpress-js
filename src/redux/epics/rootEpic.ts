import { combineEpics } from 'redux-observable';
import {
    fetchTimeSeriesSamplesExpressionsEpic,
    timeSeriesSelectedEpic,
    fetchTimeSeriesEpic,
} from './timeSeriesEpics';
import { connectToWebSocketServiceEpic, connectToServerEpic } from './connectToServerEpic';
import { loginEpic, getCurrentUserEpic, logoutEpic } from './authenticationEpics';

const rootEpic = combineEpics(
    connectToWebSocketServiceEpic,
    connectToServerEpic,
    loginEpic,
    logoutEpic,
    getCurrentUserEpic,
    fetchTimeSeriesSamplesExpressionsEpic,
    timeSeriesSelectedEpic,
    fetchTimeSeriesEpic,
);

export default rootEpic;
