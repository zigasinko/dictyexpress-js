import React from 'react';

export const Version = () => (
    <span className="version">
        {process.env.REACT_APP_VERSION}
        {process.env.REACT_APP_DEPLOY_ENV === 'staging'
            ? `+${process.env.REACT_APP_COMMIT_SHA as string}`
            : ''}
    </span>
);
