import { fromStream } from 'mobx-utils';
import { EMPTY, from, of } from 'rxjs';
import { getOrCreateData } from 'api';
import { catchError, map, mergeMap } from 'rxjs/operators';
import RootStoreMobx from 'mobx/rootStoreMobx';
import { reaction, trace } from 'mobx';
import { ProcessSlug } from 'components/genexpress/common/constants';
import {
    DataGOEnrichmentAnalysis,
    DONE_DATA_STATUS,
    ERROR_DATA_STATUS,
} from '@genialis/resolwe/dist/api/types/rest';
import { DisposeFunction as QueryObserverDisposeFunction } from 'managers/queryObserverManager';
import { getDataReactiveMobx } from 'api/dataApi';

/* If analysis isn't cached on the server, it's data will be pushed via WebSocket. So if any of parameters
 * change, we must unsubscribe previous queryObserver. This way we avoid race conditions.
 */
let activeQueryObserverDisposeFunction: QueryObserverDisposeFunction;

export default (storeMobx: RootStoreMobx): void => {
    const handleAnalysisDataResponse = (response: DataGOEnrichmentAnalysis): void => {
        if (response.status === ERROR_DATA_STATUS) {
            // eslint-disable-next-line no-console
            console.log(
                `Gene ontology enrichment analysis ended with an error ${
                    response.process_error.length > 0 ? response.process_error[0] : ''
                }`,
            );
            return;
        }

        if (response.status === DONE_DATA_STATUS && response.output.terms != null) {
            storeMobx.gOEnrichment.loadStorage(response.output.terms);
        }
    };

    void reaction(
        () => {
            trace(true);
            return {
                gaf: storeMobx.gOEnrichment.gaf,
                selectedGenes: storeMobx.genes.selectedGenes,
                pValueThreshold: storeMobx.gOEnrichment.pValueThreshold,
            };
        },
        ({ gaf, selectedGenes, pValueThreshold }) => {
            // trace(true);
            if (gaf != null) {
                // Cleanup queryObserverManager existing observer waiting to receive process
                // data via WebSocket.
                if (activeQueryObserverDisposeFunction != null) {
                    void activeQueryObserverDisposeFunction();
                }

                storeMobx.gOEnrichment.clearJson();

                if (selectedGenes != null && selectedGenes.length > 0) {
                    storeMobx.gOEnrichment.setIsLoading(true);

                    fromStream(
                        from(
                            getOrCreateData<DataGOEnrichmentAnalysis>(
                                {
                                    genes: selectedGenes.map((gene) => gene.feature_id),
                                    pval_threshold: pValueThreshold,
                                    source: storeMobx.genes.source,
                                    species: storeMobx.genes.species,
                                    ontology: 14305,
                                    gaf: gaf.id,
                                },
                                ProcessSlug.goEnrichment,
                            ),
                        ).pipe(
                            mergeMap((getOrCreateResponse) => {
                                return from(
                                    getDataReactiveMobx<DataGOEnrichmentAnalysis>(
                                        getOrCreateResponse.id,
                                        handleAnalysisDataResponse,
                                    ),
                                ).pipe(
                                    map((dataResponse) => {
                                        activeQueryObserverDisposeFunction =
                                            dataResponse.disposeFunction;
                                        handleAnalysisDataResponse(dataResponse.item);
                                    }),
                                    catchError(() => {
                                        // eslint-disable-next-line no-console
                                        console.log(
                                            `Gene ontology enrichment analysis ended with an error.`,
                                        );
                                        return EMPTY;
                                    }),
                                );
                            }),
                            catchError(() => {
                                // eslint-disable-next-line no-console
                                console.log(`Error creating gene ontology enrichment process.`);
                                return of(EMPTY);
                            }),
                        ),
                    );
                } else {
                    storeMobx.gOEnrichment.setIsLoading(false);
                }
            }
        },
    );
};
