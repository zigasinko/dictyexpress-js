import { fromStream } from 'mobx-utils';
import { EMPTY, from } from 'rxjs';
import { getGafs } from 'api';
import { filterNullAndUndefined } from 'redux/epics/rxjsCustomFilters';
import { catchError, map } from 'rxjs/operators';
import { findAppropriateGaf } from 'redux/epics/gafEpics';
import RootStoreMobx from 'mobx/rootStoreMobx';
import { reaction } from 'mobx';
import _ from 'lodash';

export default (storeMobx: RootStoreMobx): void => {
    void reaction(
        () => {
            return storeMobx.genes.selectedGenes;
        },
        (selectedGenes) => {
            if (
                selectedGenes != null &&
                selectedGenes.length > 0 &&
                _.isEmpty(storeMobx.gOEnrichment.gaf)
            ) {
                fromStream(
                    from(getGafs()).pipe(
                        map((gafs) => (gafs.length === 0 ? null : gafs)),
                        filterNullAndUndefined(),
                        map((gafs) => {
                            const annotationGaf = findAppropriateGaf(
                                storeMobx.genes.selectedGenes[0].source,
                                storeMobx.genes.selectedGenes[0].species,
                                gafs,
                            );

                            if (annotationGaf != null) {
                                storeMobx.gOEnrichment.setGaf(annotationGaf);
                                return;
                            }

                            throw new Error(
                                `No matching GAF annotation was found for species '${selectedGenes[0].species}'.`,
                            );
                        }),
                        catchError((error) => {
                            // eslint-disable-next-line no-console
                            console.log(`Error retrieving gaf file: ${error.message}`, error);
                            return EMPTY;
                        }),
                    ),
                );
            }
        },
    );
};
