import { combineEpics } from 'redux-observable';
import {
    fetchTimeSeriesSamplesExpressionsEpic,
    timeSeriesSelectedEpic,
    fetchTimeSeriesEpic,
    fetchDifferentialExpressionsDataEpic,
    fetchDifferentialExpressionsEpic,
} from './timeSeriesEpics';
import { connectToWebSocketServiceEpic, connectToServerEpic } from './connectToServerEpic';
import { loginEpic, getCurrentUserEpic, logoutEpic } from './authenticationEpics';
import { fetchSelectedDifferentialExpressionGenesEpic } from './genesEpics';
import { layoutsChangedEpic } from './layoutsEpics';

const rootEpic = combineEpics(
    layoutsChangedEpic,
    connectToWebSocketServiceEpic,
    connectToServerEpic,
    loginEpic,
    logoutEpic,
    getCurrentUserEpic,
    fetchTimeSeriesSamplesExpressionsEpic,
    fetchDifferentialExpressionsEpic,
    fetchDifferentialExpressionsDataEpic,
    fetchSelectedDifferentialExpressionGenesEpic,
    timeSeriesSelectedEpic,
    fetchTimeSeriesEpic,
);

export default rootEpic;
