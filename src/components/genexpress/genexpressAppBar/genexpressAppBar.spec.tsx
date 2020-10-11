import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { customRender } from 'tests/test-utils';
import { testState, mockStore, generateUser } from 'tests/mock';
import { MockStoreEnhanced } from 'redux-mock-store';
import { RootState } from 'redux/rootReducer';
import { AppDispatch } from 'redux/appStore';
import { logout } from 'redux/epics/authenticationEpics';
import { User } from '@genialis/resolwe/dist/api/types/rest';
import GenexpressAppBar from './genexpressAppBar';

const initialTestState = testState();

describe('not logged in', () => {
    let mockedStore: MockStoreEnhanced<RootState, AppDispatch>;

    beforeEach(() => {
        initialTestState.authentication.user = {} as User;
        initialTestState.authentication.isLoggedIn = false;
        mockedStore = mockStore(initialTestState);
        mockedStore.clearActions();

        customRender(<GenexpressAppBar isLoading={false} />, {
            mockedStore,
        });
    });

    it('should open login dialog', async () => {
        fireEvent.click(await screen.findByText('Login'));

        expect(await screen.findByLabelText('Username'));
        expect(await screen.findByLabelText('Password'));
    });
});

describe('already logged in', () => {
    let mockedStore: MockStoreEnhanced<RootState, AppDispatch>;

    beforeEach(() => {
        initialTestState.authentication.user = generateUser(1);
        initialTestState.authentication.isLoggedIn = true;
        mockedStore = mockStore(initialTestState);
        mockedStore.clearActions();

        customRender(<GenexpressAppBar isLoading={false} />, {
            mockedStore,
        });
    });

    it('should call login on user full name click', async () => {
        fireEvent.click(
            await screen.findByText(
                `${initialTestState.authentication.user.first_name} ${initialTestState.authentication.user.last_name}`,
            ),
        );

        await waitFor(() => expect(mockedStore.getActions()).toEqual([logout()]));
    });
});
