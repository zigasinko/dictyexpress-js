import React, { ReactElement, ComponentType } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { render, RenderResult, waitFor } from '@testing-library/react';
import { ThemeProvider as StyledComponentsThemeProvider } from 'styled-components';
import { createTheme, StylesProvider, MuiThemeProvider } from '@material-ui/core';
import { SnackbarProvider } from 'notistack';
import { MockStoreEnhanced } from 'redux-mock-store';
import { AppDispatch } from 'redux/appStore';
import { RendererContext } from 'components/common/rendererContext';
import {
    ExportFile,
    getRegisteredComponentsExportFiles,
} from 'components/genexpress/common/reportBuilder/reportBuilder';
import { MemoryRouter } from 'react-router-dom';
import { BackendAppState } from 'redux/models/rest';
import { BookmarkComponentsState } from 'redux/models/internal';
import { BookmarkReduxState, RootState } from '../redux/rootReducer';
import theme from '../components/app/theme';
import { GlobalStyle } from '../components/app/globalStyle';
import getStore from '../redux/rootStore';

const appTheme = createTheme(theme);

export type CustomRenderOptions = {
    initialState?: RootState;
    mockedStore?: MockStoreEnhanced<RootState, AppDispatch>;
    route?: string;
};

export const customRender = (ui: ReactElement, options?: CustomRenderOptions): RenderResult => {
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
                                <SnackbarProvider maxSnack={3}>
                                    <MemoryRouter
                                        initialEntries={
                                            options?.route != null ? [options?.route] : undefined
                                        }
                                    >
                                        {children}
                                    </MemoryRouter>
                                </SnackbarProvider>
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
 * Be sure to call "fetchMock.mockClear();" before test using this function.
 */
export const getFetchMockCallsWithUrl = (
    expectedUrl: string,
): jest.MockContext<Promise<Response>, unknown[]>['calls'] => {
    return fetchMock.mock.calls.filter(
        ([requestUrl]) => requestUrl != null && (requestUrl as string).includes(expectedUrl),
    );
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

    if (request.url.includes('make_read_only')) {
        return Promise.resolve(JSON.stringify({ id: '', modified: '' }));
    }

    return null;
};

export const resolveStringifiedObjectPromise = (object: unknown): Promise<string> => {
    return Promise.resolve(JSON.stringify(object));
};

/**
 * Be sure to call "fetchMock.mockClear();" before test using this validator.
 */
export const validateCreateStateRequest = async (
    validateCreatedBookmarkState: (
        bookmarkState: BookmarkReduxState & BookmarkComponentsState,
    ) => void,
): Promise<void> => {
    return waitFor(() => {
        const createAppStateCalls = fetchMock.mock.calls.filter((call) =>
            call[0]?.toString().includes('app-state'),
        );

        expect(createAppStateCalls).toHaveLength(1);
        const createBookmarkRequest = JSON.parse(
            createAppStateCalls[0][1]?.body as string,
        ) as BackendAppState<BookmarkReduxState & BookmarkComponentsState>;

        validateCreatedBookmarkState(createBookmarkRequest.state);
    });
};

export const waitForButtonEnabled = (getHtmlElement: () => HTMLElement): Promise<void> => {
    return waitFor(() => expect(getHtmlElement()).toBeEnabled());
};
