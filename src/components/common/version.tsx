import React, { ReactElement } from 'react';

export const Version = (): ReactElement => (
    <span className="version">
        {import.meta.env.VITE_APP_VERSION}
        {import.meta.env.VITE_APP_DEPLOY_ENV === 'staging'
            ? `+${(import.meta.env.VITE_APP_COMMIT_SHA as string).substring(0, 8)}`
            : ''}
    </span>
);
