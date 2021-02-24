/* eslint-disable global-require */
import React from 'react';
import ReactDOM from 'react-dom';
import { initializeSentry } from 'utils/sentryUtils';
import App from 'components/app/app';

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
