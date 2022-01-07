/* eslint-disable global-require */
import React from 'react';
import ReactDOM from 'react-dom';
import { initializeSentry } from 'utils/sentryUtils';
import { createBrowserHistory } from 'history';
import App from 'components/app/app';

const history = createBrowserHistory();

// eslint-disable-next-line no-console
console.info(
    `${process.env.REACT_APP_NAME || ''} v${process.env.REACT_APP_VERSION || ''} ${
        process.env.REACT_APP_COMMIT_SHA || ''
    }`,
);

if (process.env.NODE_ENV === 'production') {
    if (process.env.REACT_APP_SENTRY_URL) {
        initializeSentry(process.env.REACT_APP_SENTRY_URL);
    }
}
const rootElement = document.getElementById('root');

/*
 * S3 bucket has limitations for client side routing. A special rule was
 * added to remove 404 / redirect error.
 * Based on https://via.studio/journal/hosting-a-reactjs-app-with-routing-on-aws-s3
 *
 * Basically S3 bucket redirects all not found paths to a path with a "#!" prefix.
 * Application has to remove this special character and fix URL in browser.
 */
// eslint-disable-next-line no-restricted-globals
const path = (/#!(.*)$/.exec(location.hash) || [])[1];
if (path) {
    history.replace(path);
}

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    rootElement,
);

if (module.hot) {
    module.hot.accept('./components/app/app', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const NextApp = require('./components/app/app').default;
        ReactDOM.render(<NextApp />, rootElement);
    });
}
