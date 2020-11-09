import { combineEpics } from 'redux-observable';
import authenticationEpics from './authenticationEpics';
import connectToServerEpics from './connectToServerEpics';
import genesEpics from './genesEpics';
import timeSeriesEpics from './timeSeriesEpics';
import layoutsEpics from './layoutsEpics';

const rootEpic = combineEpics(
    authenticationEpics,
    connectToServerEpics,
    layoutsEpics,
    timeSeriesEpics,
    genesEpics,
);

export default rootEpic;
