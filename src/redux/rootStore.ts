import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import rootReducer from 'redux/rootReducer';

/* In production mode, immutable-state-invariant and serializable-state-invariant-middleware middlewares are disabled by default.
* If you want the same performance in development, disable immutableCheck and serializableCheck in 
getDefaultMiddleware function: getDefaultMiddelwareOptions = { immutableCheck: false, serializableCheck: false }.
*/
const middleware = getDefaultMiddleware();

const store = configureStore({ reducer: rootReducer, middleware });

if (module.hot) {
    module.hot.accept('./rootReducer', () => {
        store.replaceReducer(rootReducer);
    });
}

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();

export default store;
