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
} from '@material-ui/core';
import { SnackbarProvider } from 'notistack';
import LandingPage from 'components/landing/landingPage';
import PageNotFound from 'components/pageNotFound';
import GeneExpressGrid from 'components/genexpress/geneExpressGrid';
import { RendererContext } from 'components/common/rendererContext';
import { GlobalStyle } from './globalStyle';
import theme from './theme';
import appStore from '../../redux/appStore';

const appTheme = createMuiTheme(theme);

const App = (): ReactElement => {
    return (
        <RendererContext.Provider value="canvas">
            <StylesProvider injectFirst>
                <ReduxProvider store={appStore}>
                    <MuiThemeProvider theme={appTheme}>
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
                </ReduxProvider>
            </StylesProvider>
        </RendererContext.Provider>
    );
};

export default App;
