import React, { ReactElement } from 'react';
import { Route, Switch, BrowserRouter } from 'react-router-dom';
import './App.css';
import '@progress/kendo-theme-default/dist/all.css';
import { ThemeProvider } from 'styled-components';
import LandingPage from '../landing/LandingPage';
import PageNotFound from '../PageNotFound';
import { theme, GlobalStyle } from './globalStyle';

const App = (): ReactElement => {
    return (
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
    );
};

export default App;
