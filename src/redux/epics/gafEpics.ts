import { ofType, Epic, combineEpics } from 'redux-observable';
import { map, mergeMap, catchError, withLatestFrom } from 'rxjs/operators';
import { of, from } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import dataApi from 'api/dataApi';
import { DataGafAnnotation } from '@genialis/resolwe/dist/api/types/rest';
import _ from 'lodash';
import { gafFetchSucceeded, getGaf } from 'redux/stores/gOEnrichment';
import { genesSelected, getSelectedGenes } from 'redux/stores/genes';
import { Action } from '@reduxjs/toolkit';
import { handleError } from 'utils/errorUtils';
import { gafAlreadyFetched } from './epicsActions';
import { filterNullAndUndefined } from './rxjsCustomFilters';

const findAppropriateGaf = (
    source: string,
    species: string,
    annotationGafs: DataGafAnnotation[],
): DataGafAnnotation | undefined => {
    const speciesAndSourceGaf = _.find(
        annotationGafs,
        (gaf) => gaf.output.species === species && gaf.output.source === source,
    );
    const speciesGaf = _.find(annotationGafs, (gaf) => gaf.output.species === species);
    const annotationGaf = speciesAndSourceGaf || speciesGaf;

    return annotationGaf;
};

const fetchGafEpic: Epic<Action, Action, RootState> = (action$, state$) => {
    return action$.pipe(
        ofType(genesSelected),
        withLatestFrom(state$),
        mergeMap(([, state]) => {
            // If gaf file is already in redux store, there's no need to fetch it again.
            // It will get automatically removed from store when timeSeries get changed
            // or all genes are deselected.
            const gaf = getGaf(state.gOEnrichment);

            if (!_.isEmpty(gaf)) {
                return of(gafAlreadyFetched());
            }

            return from(dataApi.getGafs()).pipe(
                map((gafs) => (gafs.length === 0 ? null : gafs)),
                filterNullAndUndefined(),
                map((gafs) => {
                    const selectedGenes = getSelectedGenes(state.genes);

                    const annotationGaf = findAppropriateGaf(
                        selectedGenes[0].source,
                        selectedGenes[0].species,
                        gafs,
                    );

                    if (annotationGaf != null) {
                        return gafFetchSucceeded(annotationGaf);
                    }

                    throw new Error(
                        `No matching GAF annotation was found for species '${selectedGenes[0].species}'.`,
                    );
                }),
                catchError((error) => {
                    return of(handleError(`Error retrieving gaf file: ${error.message}`, error));
                }),
            );
        }),
    );
};

export default combineEpics(fetchGafEpic);
