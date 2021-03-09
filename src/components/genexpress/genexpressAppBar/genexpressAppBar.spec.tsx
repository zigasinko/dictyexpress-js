import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { customRender } from 'tests/test-utils';
import { testState, mockStore, generateUser } from 'tests/mock';
import { MockStoreEnhanced } from 'redux-mock-store';
import { RootState } from 'redux/rootReducer';
import { AppDispatch } from 'redux/appStore';
import { User } from '@genialis/resolwe/dist/api/types/rest';
import { logout } from 'redux/epics/epicsActions';
import GenexpressAppBar from './genexpressAppBar';

describe('genexpressAppBar', () => {
    let initialState: RootState;

    describe('not logged in', () => {
        let mockedStore: MockStoreEnhanced<RootState, AppDispatch>;

        beforeEach(() => {
            initialState = testState();
            initialState.authentication.user = {} as User;
            initialState.authentication.isLoggedIn = false;
            mockedStore = mockStore(initialState);
            mockedStore.clearActions();

            customRender(<GenexpressAppBar isLoading={false} />, {
                mockedStore,
            });
        });

        it('should open login modal', async () => {
            fireEvent.click(await screen.findByText('Login'));

            expect(await screen.findByLabelText('Username'));
            expect(await screen.findByLabelText('Password'));
        });
    });

    describe('already logged in', () => {
        let mockedStore: MockStoreEnhanced<RootState, AppDispatch>;

        beforeEach(() => {
            initialState.authentication.user = generateUser(1);
            initialState.authentication.isLoggedIn = true;
            mockedStore = mockStore(initialState);
            mockedStore.clearActions();

            customRender(<GenexpressAppBar isLoading={false} />, {
                mockedStore,
            });
        });

        it('should call logout on user full name click', async () => {
            fireEvent.click(
                await screen.findByText(
                    `${initialState.authentication.user.first_name} ${initialState.authentication.user.last_name}`,
                ),
            );

            fireEvent.click(await screen.findByText('Logout'));

            await waitFor(() => expect(mockedStore.getActions()).toEqual([logout()]));
        });
    });
});
