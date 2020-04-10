import React, { ReactElement } from 'react';
import { Route, Switch, BrowserRouter } from 'react-router-dom';
import './app.scss';
import { ThemeProvider } from 'styled-components';
import { StylesProvider } from '@material-ui/core';
import LandingPage from '../landing/landingPage';
import PageNotFound from '../pageNotFound';
import { theme, GlobalStyle } from './globalStyle';

const App = (): ReactElement => {
    return (
        <StylesProvider injectFirst>
            <ThemeProvider theme={theme}>
                <GlobalStyle />
                <BrowserRouter>
                    <Switch>
                        <Route exact path="/" component={LandingPage} />
                        <Route path="/landing" component={LandingPage} />
                        <Route component={PageNotFound} />
                    </Switch>
                </BrowserRouter>
            </ThemeProvider>
        </StylesProvider>
    );
};

export default App;
