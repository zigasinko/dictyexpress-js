import { configureStore, getDefaultMiddleware, EnhancedStore } from '@reduxjs/toolkit';
import rootReducer, { RootState } from './rootReducer';

/* In production mode, immutable-state-invariant and serializable-state-invariant-middleware middlewares are disabled by default.
* If you want the same performance in development, disable immutableCheck and serializableCheck in 
getDefaultMiddleware function: getDefaultMiddelwareOptions = { immutableCheck: false, serializableCheck: false }.
*/

type GetStoreProps = {
    thunk?: boolean;
    immutableCheck?: boolean;
    serializableCheck?: boolean;
};

const getStore = (
    initialState?: RootState,
    defaultMiddlewareOptions?: GetStoreProps,
): EnhancedStore => {
    const middleware = getDefaultMiddleware(defaultMiddlewareOptions);

    const store = configureStore({
        reducer: rootReducer,
        middleware,
        preloadedState: initialState,
    });

    if (module.hot) {
        module.hot.accept('./rootReducer', () => {
            store.replaceReducer(rootReducer);
        });
    }

    return store;
};

export default getStore;
