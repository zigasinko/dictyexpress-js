import { combineReducers } from 'redux';
import timeSeries from 'redux/stores/timeSeries';
import genes from 'redux/stores/genes';
import samplesExpressions from 'redux/stores/samplesExpressions';
import notifications from 'redux/stores/notifications';
import authentication from 'redux/stores/authentication';
import differentialExpressions from 'redux/stores/differentialExpressions';
import layouts from 'redux/stores/layouts';

const rootReducer = combineReducers({
    layouts,
    authentication,
    timeSeries,
    genes,
    samplesExpressions,
    differentialExpressions,
    notifications,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
