import React, { ReactElement, ComponentType } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { render, RenderResult } from '@testing-library/react';
import { ThemeProvider as StyledComponentsThemeProvider } from 'styled-components';
import { createMuiTheme, StylesProvider, MuiThemeProvider } from '@material-ui/core';
import { SnackbarProvider } from 'notistack';
import { MockStoreEnhanced } from 'redux-mock-store';
import { AppDispatch } from 'redux/appStore';
import { RendererContext } from 'components/common/rendererContext';
import {
    ExportFile,
    getRegisteredComponentsExportFiles,
} from 'components/genexpress/common/reportBuilder/reportBuilder';
import { RootState } from '../redux/rootReducer';
import theme from '../components/app/theme';
import { GlobalStyle } from '../components/app/globalStyle';
import getStore from '../redux/rootStore';

const appTheme = createMuiTheme(theme);

export type customRenderOptions = {
    initialState?: RootState;
    mockedStore?: MockStoreEnhanced<RootState, AppDispatch>;
};

export const customRender = (ui: ReactElement, options?: customRenderOptions): RenderResult => {
    const store = getStore(options?.initialState);
    store.dispatch = jest.fn(store.dispatch);

    const AllTheProviders = ({ children }: { children: ReactElement }): ReactElement => {
        return (
            <RendererContext.Provider value="svg">
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
            </RendererContext.Provider>
        );
    };

    return render(ui, {
        wrapper: AllTheProviders as ComponentType,
        ...options,
    });
};

export const validateExportFile = async (
    expectedPath: string,
    validateContent: (exportFile: ExportFile) => void,
): Promise<void> => {
    const files = await getRegisteredComponentsExportFiles();

    const exportFile = files.find(({ path }) => path === expectedPath);
    validateContent(exportFile as ExportFile);
};

/**
 * FetchMock mockResponse is defined in needed tests. This function handles (returns
 * empty responses) all common request that can be called in different modules (mostly
 * in integration tests).
 * @param request - Request that was intercepted by fetch-mock.
 */
export const handleCommonRequests = (request: Request): Promise<string> | null => {
    if (request.url.includes('csrf')) {
        return Promise.resolve('');
    }

    if (request.url.includes('unsubscribe')) {
        return Promise.resolve('');
    }

    if (request.url.includes('user?current_only')) {
        return Promise.resolve(JSON.stringify({ items: [] }));
    }

    return null;
};

export const resolveStringifiedObjectPromise = (object: unknown): Promise<string> => {
    return Promise.resolve(JSON.stringify(object));
};
