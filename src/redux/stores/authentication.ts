import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import { User } from '@genialis/resolwe/dist/api/types/rest';
import createIsFetchingSlice from './fetch';

// State slices.
const userInitialState = {} as User;
const userSlice = createSlice({
    name: 'authentication',
    initialState: userInitialState,
    reducers: {
        fetchUserSucceeded: (_state, action: PayloadAction<User>): User => {
            return action.payload;
        },
    },
});

const isLoggedInInitialState = false;
const isLoggedInSlice = createSlice({
    name: 'authentication',
    initialState: isLoggedInInitialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(userSlice.actions.fetchUserSucceeded, (_state, action): boolean => {
            return action.payload != null;
        });
    },
});

const isLoggingInSlice = createIsFetchingSlice('authentication/isLoggingIn');
const isLoggingOutSlice = createIsFetchingSlice('authentication/isLoggingOut');
const isFetchingUserSlice = createIsFetchingSlice('authentication/isFetchingUser');

const authenticationReducer = combineReducers({
    user: userSlice.reducer,
    isLoggedIn: isLoggedInSlice.reducer,
    isLoggingIn: isLoggingInSlice.reducer,
    isLoggingOut: isLoggingOutSlice.reducer,
    isFetchingUser: isFetchingUserSlice.reducer,
});

// Export actions.
export const { fetchUserSucceeded } = userSlice.actions;
export const { started: loginStarted, ended: loginEnded } = isLoggingInSlice.actions;
export const { started: logoutStarted, ended: logoutEnded } = isLoggingOutSlice.actions;
export const { started: fetchUserStarted, ended: fetchUserEnded } = isLoggingInSlice.actions;

export type AuthenticationState = ReturnType<typeof authenticationReducer>;

export default authenticationReducer;

// Selectors (exposes the store to containers).
export const getUser = (state: AuthenticationState): User => state.user;
export const getIsLoggedIn = (state: AuthenticationState): boolean => state.isLoggedIn;
export const getIsLoggingIn = (state: AuthenticationState): boolean => state.isLoggingIn;
export const getIsLoggingOut = (state: AuthenticationState): boolean => state.isLoggingOut;
export const getIsFetchingUser = (state: AuthenticationState): boolean => state.isFetchingUser;
