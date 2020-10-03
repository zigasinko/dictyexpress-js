import { ofType, Epic } from 'redux-observable';
import { ignoreElements, map } from 'rxjs/operators';
import { RootState } from 'redux/rootReducer';
import { layoutsChanged } from 'redux/stores/layouts';
import { LocalStorageKey } from 'components/genexpress/common/constants';
import { Action } from 'redux';
import { writeToLocalStorage } from 'utils/localStorageUtils';

// eslint-disable-next-line import/prefer-default-export
export const layoutsChangedEpic: Epic<Action, Action, RootState> = (action$) =>
    action$.pipe(
        ofType<Action, ReturnType<typeof layoutsChanged>>(layoutsChanged.toString()),
        map((action) => {
            writeToLocalStorage(LocalStorageKey.LAYOUTS, action.payload);
        }),
        ignoreElements(),
    );
