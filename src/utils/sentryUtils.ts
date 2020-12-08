import { Severity } from '@sentry/browser';
import * as Sentry from '@sentry/browser';
import { User } from '@genialis/resolwe/dist/api/types/rest';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { ResponseError } from 'redux/models/internal';
import { getUsername } from './user';

/**
 * Configure sentry for sending future events.
 * @param sentryUrl - aka DSN. Destination of events.
 */
export const initializeSentry = (sentryUrl: string): void => {
    Sentry.init({
        dsn: sentryUrl,
        // Send stack trace for non-error messages too.
        attachStacktrace: true,
    });
};

/**
 * Append user info to future error messages.
 * @param user - Logged in user data (null if user is not logged in).
 */
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

/**
 * Send event to sentry (almost always it's an error).
 * @param message - Text message.
 * @param associatedObject - Data to be appended to sentry event as an associated object.
 * @param severity - Event severity.
 */
export const sentryCapture = (
    message: string,
    associatedObject: {} | Error | ResponseError = '',
    severity: Severity = Severity.Error,
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
