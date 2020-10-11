import { combineReducers } from 'redux';
import timeSeries from 'redux/stores/timeSeries';
import selectedGenes from 'redux/stores/genes';
import samplesExpressions from 'redux/stores/samplesExpressions';
import notifications from 'redux/stores/notifications';
import authentication from 'redux/stores/authentication';

const rootReducer = combineReducers({
    authentication,
    timeSeries,
    selectedGenes,
    samplesExpressions,
    notifications,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
