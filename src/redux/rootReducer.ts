import timeSeries from 'redux/stores/timeSeries';
import genes from 'redux/stores/genes';
import samplesExpressions from 'redux/stores/samplesExpressions';
import notifications from 'redux/stores/notifications';
import authentication from 'redux/stores/authentication';
import differentialExpressions from 'redux/stores/differentialExpressions';
import layouts from 'redux/stores/layouts';
import gOEnrichment from 'redux/stores/gOEnrichment';
import { combineReducers } from '@reduxjs/toolkit';

const rootReducer = combineReducers({
    layouts,
    authentication,
    timeSeries,
    genes,
    samplesExpressions,
    differentialExpressions,
    gOEnrichment,
    notifications,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
