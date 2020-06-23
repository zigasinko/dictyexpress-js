import React from 'react';
import { customRender } from 'tests/test-utils';
import { mockStore, testState } from 'tests/mock';
import { SnackbarNotifications } from 'redux/models/internal';
import SnackbarNotifier from './snackbarNotifier';

const initialTestState = testState();
const testNotifications: SnackbarNotifications = [
    { key: '1', message: 'Test message', variant: 'default', action: (): void => {} },
    { key: '2', message: 'Test message 2', variant: 'error', action: (): void => {} },
    { key: '3', message: 'Test message 3', variant: 'success', action: (): void => {} },
    { key: '4', message: 'Test message 4', variant: 'info', action: (): void => {} },
    { key: '5', message: 'Test message 5', variant: 'warning', action: (): void => {} },
];

initialTestState.notifications.notifications = testNotifications;

const mockedStore = mockStore(initialTestState);

describe('snackbarNotifier', () => {
    it('should render as snapshot with notifications in all different variants', () => {
        const { asFragment } = customRender(<SnackbarNotifier />, {
            mockedStore,
        });

        expect(asFragment()).toMatchSnapshot();
    });
});
