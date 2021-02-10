import { DataGafAnnotation } from '@genialis/resolwe/dist/api/types/rest';
import { getStorage } from 'api';
import { action, makeAutoObservable, runInAction } from 'mobx';
import { fromStream } from 'mobx-utils';
// eslint-disable-next-line import/no-cycle
import RootStoreMobx from 'mobx/rootStoreMobx';
import { EnhancedGOEnrichmentJson } from 'redux/models/internal';
import { pValueThresholdsOptions } from 'redux/stores/gOEnrichment';
import { EMPTY, from } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { appendMissingAttributesToJson } from 'utils/gOEnrichmentUtils';

class GOEnrichmentStoreMobx {
    private rootStoreMobx: RootStoreMobx;

    isLoading = false;

    json = null as EnhancedGOEnrichmentJson | null;

    gaf = null as DataGafAnnotation | null;

    pValueThreshold = pValueThresholdsOptions[0];

    constructor(rootStoreMobx: RootStoreMobx) {
        this.rootStoreMobx = rootStoreMobx;
        makeAutoObservable(this, { setIsLoading: action, clearJson: action });
    }

    setJson(json: EnhancedGOEnrichmentJson): void {
        this.json = json;
    }

    setIsLoading(isLoading: boolean): void {
        this.isLoading = isLoading;
    }

    setGaf(gaf: DataGafAnnotation): void {
        runInAction(() => {
            this.gaf = gaf;
        });
    }

    setPValueThreshold(pValueThreshold: number): void {
        this.pValueThreshold = pValueThreshold;
    }

    loadStorage(id: number): void {
        fromStream(
            from(getStorage(id)).pipe(
                map((storage) => {
                    appendMissingAttributesToJson(
                        storage.json,
                        this.rootStoreMobx.genes.source,
                        this.rootStoreMobx.genes.species,
                    );

                    this.setJson(storage.json);
                }),
                catchError((error) => {
                    // eslint-disable-next-line no-console
                    console.log(`Error retrieving gene ontology enrichment storage.`, error);
                    return EMPTY;
                }),
                finalize(() => {
                    this.setIsLoading(false);
                }),
            ),
        );
    }

    clearJson(): void {
        this.json = null;
    }

    clearPValueThreshold(): void {
        [this.pValueThreshold] = pValueThresholdsOptions;
    }
}

export default GOEnrichmentStoreMobx;
