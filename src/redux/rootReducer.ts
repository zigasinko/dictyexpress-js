import { combineReducers } from 'redux';
import timeSeries from './stores/timeSeries';
import selectedGenes from './stores/genes';
import samplesExpressions from './stores/samplesExpressions';

const rootReducer = combineReducers({
    timeSeries,
    selectedGenes,
    samplesExpressions,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
