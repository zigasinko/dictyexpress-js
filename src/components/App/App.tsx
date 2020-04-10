import React from 'react';
import { Route, Switch, RouteProps, BrowserRouter } from 'react-router-dom';
import './App.css';
import '@progress/kendo-theme-default/dist/all.css';
import LandingPage from '../landing/LandingPage';
import PageNotFound from '../PageNotFound';

const App: React.FunctionComponent<RouteProps> = () => {
    return (
        <div>
            <BrowserRouter>
                <Switch>
                    <Route exact path="/" component={LandingPage} />
                    <Route path="/landing" component={LandingPage} />
                    <Route component={PageNotFound} />
                </Switch>
            </BrowserRouter>
        </div>
    );
};

export default App;
