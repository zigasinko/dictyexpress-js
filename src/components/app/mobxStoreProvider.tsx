import { useLocalObservable } from 'mobx-react-lite';
import React, { createContext, ReactElement, useContext, useEffect } from 'react';
import RootStoreMobx from 'mobx/rootStoreMobx';
import genesReactions from 'mobx/reactions/genesReactions';
import gOEnrichmentReactions from 'mobx/reactions/gOEnrichmentReactions';

const storeContext = createContext<RootStoreMobx>({} as RootStoreMobx);

export const MobxStoreProvider = ({ children }: { children: ReactElement }): ReactElement => {
    const store = useLocalObservable(() => new RootStoreMobx());

    // Setup all reactions.
    useEffect(() => {
        genesReactions(store);
        gOEnrichmentReactions(store);

        store.webSocketStore.connect();
    }, [store]);

    return <storeContext.Provider value={store}>{children}</storeContext.Provider>;
};

export const useMobxStore = (): RootStoreMobx => {
    const store = useContext(storeContext);
    if (!store) {
        // this is especially useful in TypeScript so you don't need to be checking for null all the time
        throw new Error('useStore must be used within a StoreProvider.');
    }
    return store;
};
