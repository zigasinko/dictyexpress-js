import { Severity } from '@sentry/browser';
import * as Sentry from '@sentry/browser';
import { User } from '@genialis/resolwe/dist/api/types/rest';
import { getUsername } from './user';

export const initializeSentry = (sentryUrl: string): void => {
    Sentry.init({
        dsn: sentryUrl,
        // Send stack trace for non-error messages too.
        attachStacktrace: true,
    });
};

export const setUser = (user: User | void): void => {
    if (user != null) {
        Sentry.setUser({
            id: `${user.id}`,
            username: user.username,
            name: getUsername(user),
        });
    }
};

export const sentryCapture = (
    message: string,
    associatedObject: {} | Error = '',
    severity: Severity = Severity.Error,
): string => {
    return Sentry.captureMessage(message, {
        extra: {
            associatedObject,
        },
        level: severity,
    });
};
