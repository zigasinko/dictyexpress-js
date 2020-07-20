import { combineReducers } from 'redux';
import timeSeries from './stores/timeSeries';
import selectedGenes from './stores/genes';

const rootReducer = combineReducers({
    timeSeries,
    selectedGenes,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
