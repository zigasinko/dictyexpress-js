import React from 'react';
import ReactDOM from 'react-dom';
import { initializeSentry } from './utils/sentryUtils';
import App from './components/app/app';

if (process.env.NODE_ENV === 'production') {
    if (process.env.REACT_APP_SENTRY_URL) {
        initializeSentry(process.env.REACT_APP_SENTRY_URL);
    }
}

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root'),
);
