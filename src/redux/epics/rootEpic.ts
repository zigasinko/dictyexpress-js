import { combineEpics } from 'redux-observable';
import authenticationEpics from './authenticationEpics';
import connectToServerEpics from './connectToServerEpics';
import genesEpics from './genesEpics';
import timeSeriesEpics from './timeSeriesEpics';
import layoutsEpics from './layoutsEpics';
import gOEnrichmentEpics from './gOEnrichmentEpics';
import gafEpics from './gafEpics';

const rootEpic = combineEpics(
    authenticationEpics,
    connectToServerEpics,
    layoutsEpics,
    timeSeriesEpics,
    gafEpics,
    gOEnrichmentEpics,
    genesEpics,
);

export default rootEpic;
