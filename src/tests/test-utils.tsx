import React, { ReactElement } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { render, RenderResult, waitFor } from '@testing-library/react';
import { ThemeProvider as StyledComponentsThemeProvider } from 'styled-components';
import { createTheme } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { MockStoreEnhanced } from 'redux-mock-store';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { BookmarkReduxState, RootState } from '../redux/rootReducer';
import theme from '../components/app/theme';
import { GlobalStyle } from '../components/app/globalStyle';
import getStore from '../redux/rootStore';
import { BookmarkComponentsState, Gene } from 'redux/models/internal';
import { BackendAppState } from 'redux/models/rest';
import {
    ExportFile,
    getRegisteredComponentsExportFiles,
} from 'components/genexpress/common/reportBuilder/reportBuilder';
import { RendererContext } from 'components/common/rendererContext';
import { AppDispatch } from 'redux/appStore';

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
                <StyledEngineProvider injectFirst>
                    <ReduxProvider store={options?.mockedStore ?? store}>
                        <ThemeProvider theme={appTheme}>
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
                        </ThemeProvider>
                    </ReduxProvider>
                </StyledEngineProvider>
            </RendererContext.Provider>
        );
    };

    return render(ui, {
        wrapper: AllTheProviders,
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

export const resolveStringifiedObjectPromise = (object: unknown): Promise<string> => {
    return Promise.resolve(JSON.stringify(object));
};

/**
 * FetchMock mockResponse is defined in needed tests. This function handles (returns
 * empty responses) all common request that can be called in different modules (mostly
 * in integration tests).
 * @param request - Request that was intercepted by fetch-mock.
 */
export const handleCommonRequests = async (
    request: Request,
    genes?: Gene[],
): Promise<Promise<string> | null> => {
    if (request.url.includes('csrf')) {
        return Promise.resolve('');
    }

    if (request.url.includes('unsubscribe')) {
        return Promise.resolve('');
    }

    if (request.url.includes('subscribe')) {
        return resolveStringifiedObjectPromise({ subscription_id: '' });
    }

    if (request.url.includes('user?current_only')) {
        return resolveStringifiedObjectPromise([]);
    }

    if (request.url.includes('make_read_only')) {
        return resolveStringifiedObjectPromise({ id: '', modified: '' });
    }

    if (genes != null && request.url.includes('paste')) {
        const { pasted } = request.body && (await request.json());
        return resolveStringifiedObjectPromise(
            genes.filter((gene) => (pasted as string[]).includes(gene.name)),
        );
    }
    if (request.url.includes('descriptorschema')) {
        return resolveStringifiedObjectPromise([]);
    }

    return null;
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
        const createAppStateCalls = fetchMock.mock.calls.filter(
            (call) => call[0]?.toString().includes('app-state'),
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
