import { SeverityLevel } from '@sentry/browser';
import * as Sentry from '@sentry/browser';
import { User } from '@genialis/resolwe/dist/api/types/rest';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { ResponseError } from 'redux/models/internal';
import { getUsername } from './user';

export const initializeSentry = (sentryUrl: string): void => {
    Sentry.init({
        dsn: sentryUrl,
        // Send stack trace for non-error messages too.
        attachStacktrace: true,
    });
};

export const setSentryUser = (user: User | void): void => {
    if (user != null) {
        Sentry.setUser({
            id: `${user.id}`,
            username: user.username,
            name: getUsername(user),
        });
    } else {
        Sentry.setUser(null);
    }
};

export const sentryCapture = (
    message: string,
    associatedObject: Record<string, unknown> | Error | ResponseError = {},
    severity: SeverityLevel = 'error',
): string => {
    // If an error is attached, log the same error twice.
    // Once with a stack trace to errorLog and once with the stack trace of the appended error.
    if (_.isError(associatedObject)) {
        const linkedEventsUuid = uuidv4();

        Sentry.captureException(associatedObject, {
            tags: { linkedEventsUuid },
            level: severity,
        });
        return Sentry.captureMessage(message, {
            extra: {
                associatedObject,
            },
            level: severity,
        });
    }

    return Sentry.captureMessage(message, {
        extra: {
            associatedObject,
        },
        level: severity,
    });
};
