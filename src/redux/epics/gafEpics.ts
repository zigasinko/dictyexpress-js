import { ofType, Epic, combineEpics } from 'redux-observable';
import { map, mergeMap, catchError, withLatestFrom, filter } from 'rxjs/operators';
import { of, from, EMPTY } from 'rxjs';
import { RootState } from 'redux/rootReducer';
import { pushToSentryAndAddErrorSnackbar } from 'redux/stores/notifications';
import * as dataApi from 'api/dataApi';
import { DataGafAnnotation } from '@genialis/resolwe/dist/api/types/rest';
import _ from 'lodash';
import { gafFetchSucceeded, getGaf } from 'redux/stores/gOEnrichment';
import { genesSelected, getSelectedGenes } from 'redux/stores/genes';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any, import/prefer-default-export
const fetchGafEpic: Epic<any, any, RootState, any> = (action$, state$) => {
    return action$.pipe(
        ofType(genesSelected),
        withLatestFrom(state$),
        filter(([, state]) => {
            // If gaf file is already in redux store, there's no need to fetch it again.
            // It will get automatically removed from store when timeSeries get changed.
            const gaf = getGaf(state.gOEnrichment);
            const selectedGenes = getSelectedGenes(state.genes);
            return _.isEmpty(gaf) && selectedGenes.length > 0;
        }),
        mergeMap(([, state]) => {
            return from(dataApi.getGafs()).pipe(
                map((gafs) => {
                    if (gafs.length === 0) {
                        return EMPTY;
                    }

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
                    return of(
                        pushToSentryAndAddErrorSnackbar(
                            `Error retrieving gaf file: ${error.message}`,
                            error,
                        ),
                    );
                }),
            );
        }),
    );
};

export default combineEpics(fetchGafEpic);
