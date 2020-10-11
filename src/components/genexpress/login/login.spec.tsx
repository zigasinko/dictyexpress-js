import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { customRender } from 'tests/test-utils';
import { testState, mockStore } from 'tests/mock';
import { MockStoreEnhanced } from 'redux-mock-store';
import { RootState } from 'redux/rootReducer';
import { AppDispatch } from 'redux/appStore';
import { User } from '@genialis/resolwe/dist/api/types/rest';
import { login } from 'redux/epics/authenticationEpics';
import Login from './login';

const initialTestState = testState();

it('should display sign in form', () => {
    const { asFragment } = customRender(<Login isLoginModalOpened closeModal={(): void => {}} />);

    expect(asFragment()).toMatchSnapshot();
});

describe('modal opened', () => {
    let mockedStore: MockStoreEnhanced<RootState, AppDispatch>;
    let asFragment: () => DocumentFragment;

    const usernameValue = 'asdf';
    const passwordValue = 'asdf';

    beforeEach(() => {
        initialTestState.authentication.user = {} as User;
        initialTestState.authentication.isLoggedIn = false;
        mockedStore = mockStore(initialTestState);
        mockedStore.clearActions();

        ({ asFragment } = customRender(<Login isLoginModalOpened closeModal={(): void => {}} />, {
            mockedStore,
        }));
    });

    it('should display sign in form', () => {
        expect(asFragment()).toMatchSnapshot();
    });

    it('should mask password value', () => {
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: passwordValue },
        });

        expect(screen.getByDisplayValue(passwordValue)).toHaveAttribute('type', 'password');
    });

    it('should disable submit button until username and password are entered', () => {
        expect(screen.getByRole('button', { name: 'SIGN IN' })).toBeDisabled();

        fireEvent.change(screen.getByLabelText('Username'), {
            target: { value: usernameValue },
        });

        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: passwordValue },
        });

        expect(screen.getByRole('button', { name: 'SIGN IN' })).toBeEnabled();
    });

    it('should trigger login action after user clicks SIGN IN', async () => {
        fireEvent.change(screen.getByLabelText('Username'), {
            target: { value: usernameValue },
        });

        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: passwordValue },
        });

        fireEvent.click(await screen.findByText('SIGN IN'));

        await waitFor(() =>
            expect(mockedStore.getActions()).toEqual([
                login({ username: usernameValue, password: passwordValue }),
            ]),
        );
    });
});
