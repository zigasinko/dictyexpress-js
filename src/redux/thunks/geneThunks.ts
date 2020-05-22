import { ThunkAction, AnyAction } from '@reduxjs/toolkit';
import _ from 'lodash';
import { RootState } from '../rootReducer';
import { getSelectedSamplesInfo } from '../stores/timeSeries';
import { pastedGenesFetchStarted, genesSelected, pastedGenesFetchEnded } from '../stores/genes';
import * as featureApi from '../../api/featureApi';
import { Gene } from '../models/internal';
import { fetchTimeSeriesSamplesExpressions } from './timeSeriesThunks';

/**
 * Fetch gene data for given genes names and mark them as selected. All that weren't found are
 * returned in an array.
 * @param genesNames - Names of genes that the user pasted in the search box (autocomplete input).
 */
// eslint-disable-next-line import/prefer-default-export
export const pasteGeneNames = (
    genesNames: string[],
): ThunkAction<Promise<string[]>, RootState, number | string, AnyAction> => {
    return async (dispatch, getState): Promise<string[]> => {
        dispatch(pastedGenesFetchStarted());

        const samplesInfo = getSelectedSamplesInfo(getState().timeSeries);
        const genes = await featureApi.getGenesByNames(
            samplesInfo.source,
            samplesInfo.species,
            samplesInfo.type,
            genesNames,
        );

        if (genes != null) {
            dispatch(genesSelected(genes));

            dispatch(pastedGenesFetchEnded());

            // Return every gene name that wasn't found.
            return genesNames.filter((geneName) => _.find(genes, { name: geneName }) == null);
        }

        dispatch(pastedGenesFetchEnded());

        return [];
    };
};

export const selectGenes = (genes: Gene[]): ThunkAction<void, RootState, Gene[], AnyAction> => {
    return (dispatch): void => {
        dispatch(genesSelected(genes));
        dispatch(fetchTimeSeriesSamplesExpressions());
    };
};
