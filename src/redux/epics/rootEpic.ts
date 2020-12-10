import { Action } from '@reduxjs/toolkit';
import { combineEpics, Epic } from 'redux-observable';
import { RootState } from 'redux/rootReducer';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { logError } from 'utils/errorUtils';
import authenticationEpics from './authenticationEpics';
import connectToServerEpics from './connectToServerEpics';
import genesEpics from './genesEpics';
import timeSeriesEpics from './timeSeriesEpics';
import layoutsEpics from './layoutsEpics';
import gOEnrichmentEpics from './gOEnrichmentEpics';
import gafEpics from './gafEpics';
import clusteringEpics from './clusteringEpics';

const rootEpic: Epic<Action, Action, RootState> = (
    action$,
    store$,
    dependencies,
): Observable<Action> =>
    combineEpics(
        authenticationEpics,
        connectToServerEpics,
        layoutsEpics,
        timeSeriesEpics,
        gafEpics,
        genesEpics,
        gOEnrichmentEpics,
        clusteringEpics,
    )(action$, store$, dependencies).pipe(
        catchError((error, source) => {
            logError('RootEpic global error', error);
            return source;
        }),
    );

export default rootEpic;
