import React, { ReactElement } from 'react';
import { Route, Switch, BrowserRouter } from 'react-router-dom';
import './app.scss';
import '../../../node_modules/react-grid-layout/css/styles.css';
import '../../../node_modules/react-resizable/css/styles.css';
import { ThemeProvider as StyledComponentsThemeProvider } from 'styled-components';
import { Provider as ReduxProvider } from 'react-redux';
import {
    StylesProvider,
    ThemeProvider as MuiThemeProvider,
    createMuiTheme,
    CssBaseline,
} from '@material-ui/core';
import { SnackbarProvider } from 'notistack';
import LandingPage from 'components/landing/landingPage';
import PageNotFound from 'components/pageNotFound';
import GeneExpressGrid from 'components/genexpress/geneExpressGrid';
import { RendererContext } from 'components/common/rendererContext';
import { getCSRFCookie } from 'api';
import { GlobalStyle } from './globalStyle';
import theme from './theme';
import appStore from '../../redux/appStore';
import { MobxStoreProvider } from './mobxStoreProvider';

getCSRFCookie();

const appTheme = createMuiTheme(theme);

const App = (): ReactElement => {
    return (
        <RendererContext.Provider value="svg">
            <StylesProvider injectFirst>
                <ReduxProvider store={appStore}>
                    <MobxStoreProvider>
                        <MuiThemeProvider theme={appTheme}>
                            <CssBaseline />
                            <StyledComponentsThemeProvider theme={appTheme}>
                                <GlobalStyle />
                                <SnackbarProvider maxSnack={3}>
                                    <BrowserRouter>
                                        <Switch>
                                            <Route exact path="/" component={LandingPage} />
                                            <Route path="/landing" component={LandingPage} />
                                            <Route path="/bcm" component={GeneExpressGrid} />
                                            <Route component={PageNotFound} />
                                        </Switch>
                                    </BrowserRouter>
                                </SnackbarProvider>
                            </StyledComponentsThemeProvider>
                        </MuiThemeProvider>
                    </MobxStoreProvider>
                </ReduxProvider>
            </StylesProvider>
        </RendererContext.Provider>
    );
};

export default App;
