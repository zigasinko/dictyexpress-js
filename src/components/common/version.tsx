import React, { ReactElement } from 'react';

export const Version = (): ReactElement => (
    <span className="version">
        {process.env.REACT_APP_VERSION}
        {process.env.REACT_APP_DEPLOY_ENV === 'staging'
            ? `+${(process.env.REACT_APP_COMMIT_SHA as string).substring(0, 8)}`
            : ''}
    </span>
);
