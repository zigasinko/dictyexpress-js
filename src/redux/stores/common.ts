import { ActionCreator, ActionReducerMapBuilder } from '@reduxjs/toolkit';

// eslint-disable-next-line import/prefer-default-export
export const clearStateOnActions = <T>(
    builder: ActionReducerMapBuilder<T>,
    actions: ActionCreator<unknown>[],
    initialState: T,
): void => {
    actions.forEach((action) => {
        builder.addCase(action.toString(), () => initialState);
    });
};
