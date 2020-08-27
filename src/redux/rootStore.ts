import { configureStore, getDefaultMiddleware, EnhancedStore } from '@reduxjs/toolkit';
import { createEpicMiddleware } from 'redux-observable';
import rootReducer, { RootState } from './rootReducer';
import rootEpic from './epics/rootEpic';

/* In production mode, immutable-state-invariant and serializable-state-invariant-middleware
 * middlewares are disabled by default. If you want the same performance in development, disable
 * immutableCheck and serializableCheck in getDefaultMiddleware function:
 * getDefaultMiddelwareOptions = { immutableCheck: false, serializableCheck: false }.
 */
type MiddleWareProps = {
    thunk?: boolean;
    immutableCheck?: boolean;
    serializableCheck?: boolean;
};

const getStore = (
    initialState?: RootState,
    defaultMiddlewareOptions?: MiddleWareProps,
): EnhancedStore => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const epicMiddleware = createEpicMiddleware<any, any, RootState, any>();

    const defaultMiddleware = getDefaultMiddleware(defaultMiddlewareOptions);
    const middleware = [...defaultMiddleware, epicMiddleware];

    const store = configureStore({
        reducer: rootReducer,
        middleware,
        preloadedState: initialState,
    });

    epicMiddleware.run(rootEpic);

    if (module.hot) {
        module.hot.accept('./rootReducer', () => {
            store.replaceReducer(rootReducer);
        });
    }

    return store;
};

export default getStore;
