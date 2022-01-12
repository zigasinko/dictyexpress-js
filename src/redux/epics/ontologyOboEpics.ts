import { Action } from '@reduxjs/toolkit';
import { ofType, Epic } from 'redux-observable';
import { map, catchError, mergeMap } from 'rxjs/operators';
import { of, from } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import { handleError } from 'utils/errorUtils';
import { timeSeriesFetchSucceeded } from 'redux/stores/timeSeries';
import { getOntologyObo } from 'api/dataApi';
import { ontologyOboFetchSucceeded } from 'redux/stores/gOEnrichment';

const ontologyOboEpic: Epic<Action, Action, RootState> = (action$) =>
    action$.pipe(
        ofType(timeSeriesFetchSucceeded),
        mergeMap(() => {
            return from(getOntologyObo()).pipe(
                map((ontologyOboDataObject) => {
                    return ontologyOboFetchSucceeded(ontologyOboDataObject);
                }),
                catchError((error) =>
                    of(handleError(`Error fetching ontology obo data object.`, error)),
                ),
            );
        }),
    );

export default ontologyOboEpic;
