import { Severity } from '@sentry/browser';
import { addErrorSnackbar } from 'redux/stores/notifications';
import { sentryCapture } from './sentryUtils';

/**
 * Send the error to Sentry and return "addErrorSnackbar" action.
 * @param message - Additional error message. SentryID is appended to the end of it.
 * @param error - Error that occurred.
 */
// eslint-disable-next-line import/prefer-default-export
export const handleError = (message: string, error: Error): ReturnType<typeof addErrorSnackbar> => {
    const sentryId = sentryCapture(message, error, Severity.Error);
    return addErrorSnackbar(`${message} SentryID: ${sentryId}`);
};

/**
 * Function send error to Sentry.
 * @param message - Additional error message. SentryID is appended to the end of it.
 * @param error - Error that occurred.
 */
export const logError = (message: string, error: Error): void => {
    sentryCapture(message, error, Severity.Error);
};
