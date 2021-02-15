import { Epic, combineEpics } from 'redux-observable';
import { map, mergeMap, catchError, filter } from 'rxjs/operators';
import { of, from } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import { DataGafAnnotation } from '@genialis/resolwe/dist/api/types/rest';
import _ from 'lodash';
import { gafFetchSucceeded, getGaf } from 'redux/stores/gOEnrichment';
import { getSelectedGenes } from 'redux/stores/genes';
import { Action } from '@reduxjs/toolkit';
import { handleError } from 'utils/errorUtils';
import { getGafs } from 'api';
import { filterNullAndUndefined, mapStateSlice } from './rxjsCustomFilters';

export const findAppropriateGaf = (
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
    return state$.pipe(
        mapStateSlice(
            (state) => getSelectedGenes(state.genes),
            () => _.isEmpty(getGaf(state$.value.gOEnrichment)),
        ),
        filter((selectedGenes) => selectedGenes.length > 0),
        mergeMap((selectedGenes) => {
            return from(getGafs()).pipe(
                map((gafs) => (gafs.length === 0 ? null : gafs)),
                filterNullAndUndefined(),
                map((gafs) => {
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
                catchError((error) =>
                    of(handleError(`Error retrieving gaf file: ${error.message}`, error)),
                ),
            );
        }),
    );
};

export default combineEpics(fetchGafEpic);
