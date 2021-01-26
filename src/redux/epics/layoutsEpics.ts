import { Epic } from 'redux-observable';
import { ignoreElements, map } from 'rxjs/operators';
import { RootState } from 'redux/rootReducer';
import { getLayouts } from 'redux/stores/layouts';
import { LocalStorageKey } from 'components/genexpress/common/constants';
import { Action } from 'redux';
import { writeToLocalStorage } from 'utils/localStorageUtils';
import { Layouts } from 'react-grid-layout';
import { mapStateSlice } from './rxjsCustomFilters';

const layoutsChangedEpic: Epic<Action, Action, RootState> = (action$, state$) =>
    state$.pipe(
        mapStateSlice<Layouts>((state) => getLayouts(state.layouts)),
        map((layouts) => {
            writeToLocalStorage(LocalStorageKey.layouts, layouts);
        }),
        ignoreElements(),
    );

export default layoutsChangedEpic;
