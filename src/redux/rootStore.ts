import { configureStore, getDefaultMiddleware, Action } from '@reduxjs/toolkit';
import { createEpicMiddleware, Epic } from 'redux-observable';
import { switchMap } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const getStore = (initialState?: RootState, defaultMiddlewareOptions?: MiddleWareProps) => {
    const epicMiddleware = createEpicMiddleware<Action, Action, RootState>();

    const defaultMiddleware = getDefaultMiddleware(defaultMiddlewareOptions);
    const middleware = [...defaultMiddleware, epicMiddleware];

    const store = configureStore({
        reducer: rootReducer,
        middleware,
        preloadedState: initialState,
        devTools: process.env.NODE_ENV === 'development',
    });

    const epic$ = new BehaviorSubject(rootEpic);
    // Every time a new epic is given to epic$ it
    // will unsubscribe from the previous one then
    // call and subscribe to the new one because of
    // how switchMap works
    const hotReloadingEpic: Epic<Action, Action, RootState> = (actionIn, actionOut, state) =>
        epic$.pipe(switchMap((epic) => epic(actionIn, actionOut, state)));

    epicMiddleware.run(hotReloadingEpic);

    if (module.hot) {
        module.hot.accept('./rootReducer', () => {
            store.replaceReducer(rootReducer);
        });

        module.hot.accept('./epics/rootEpic', () => {
            epic$.next(rootEpic);
        });
    }

    return store;
};

export default getStore;
