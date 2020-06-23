import React, { ReactElement, ComponentType } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { render, RenderResult } from '@testing-library/react';
import { ThemeProvider as StyledComponentsThemeProvider } from 'styled-components';
import { createMuiTheme, StylesProvider, MuiThemeProvider } from '@material-ui/core';
import { SnackbarProvider } from 'notistack';

import { MockStoreEnhanced } from 'redux-mock-store';
import { RootState } from '../redux/rootReducer';
import theme from '../components/app/theme';
import { GlobalStyle } from '../components/app/globalStyle';
import getStore from '../redux/rootStore';
import { DispatchExts } from './mock';

const appTheme = createMuiTheme(theme);

export type customRenderOptions = {
    initialState?: RootState;
    mockedStore?: MockStoreEnhanced<RootState, DispatchExts>;
};

export const customRender = (ui: ReactElement, options?: customRenderOptions): RenderResult => {
    const store = getStore(options?.initialState);
    store.dispatch = jest.fn(store.dispatch);

    const AllTheProviders = ({ children }: { children: ReactElement }): ReactElement => {
        return (
            <StylesProvider injectFirst>
                <ReduxProvider store={options?.mockedStore ?? store}>
                    <MuiThemeProvider theme={appTheme}>
                        <StyledComponentsThemeProvider theme={appTheme}>
                            <GlobalStyle />
                            <SnackbarProvider maxSnack={3}>{children}</SnackbarProvider>
                        </StyledComponentsThemeProvider>
                    </MuiThemeProvider>
                </ReduxProvider>
            </StylesProvider>
        );
    };

    return render(ui, { wrapper: AllTheProviders as ComponentType, ...options });
};

// re-export everything
export * from '@testing-library/react';
