import { combineEpics } from 'redux-observable';
import authenticationEpics from './authenticationEpics';
import connectToServerEpics from './connectToServerEpics';
import gafEpics from './gafEpics';
import genesEpics from './genesEpics';
import gOEnrichmentEpics from './gOEnrichmentEpics';
import timeSeriesEpics from './timeSeriesEpics';

const rootEpic = combineEpics(
    authenticationEpics,
    connectToServerEpics,
    timeSeriesEpics,
    gafEpics,
    genesEpics,
    gOEnrichmentEpics,
);

export default rootEpic;
