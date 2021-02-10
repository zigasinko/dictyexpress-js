import GenesStoreMobx from './stores/genesMobx';
// eslint-disable-next-line import/no-cycle
import GOEnrichmentStoreMobx from './stores/gOEnrichmentMobx';
// eslint-disable-next-line import/no-cycle
import WebSocketStoreMobx from './stores/webSocketStoreMobx';

class RootStoreMobx {
    gOEnrichment: GOEnrichmentStoreMobx;

    genes: GenesStoreMobx;

    webSocketStore: WebSocketStoreMobx;

    constructor() {
        this.gOEnrichment = new GOEnrichmentStoreMobx(this);
        this.genes = new GenesStoreMobx();
        this.webSocketStore = new WebSocketStoreMobx();
    }
}

export default RootStoreMobx;
