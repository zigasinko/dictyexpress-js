import { combineReducers } from 'redux';
import timeSeries from './stores/timeSeries';
import selectedGenes from './stores/genes';
import samplesExpressions from './stores/samplesExpressions';
import notifications from './stores/notifications';

const rootReducer = combineReducers({
    timeSeries,
    selectedGenes,
    samplesExpressions,
    notifications,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
