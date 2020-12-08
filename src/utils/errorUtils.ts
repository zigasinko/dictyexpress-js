import { Severity } from '@sentry/browser';
import { ResponseError } from 'redux/models/internal';
import { addErrorSnackbar } from 'redux/stores/notifications';
import { sentryCapture } from './sentryUtils';

/**
 * Send the error to Sentry and return "addErrorSnackbar" action. If associatedObject is
 * ResponseError type, use it's response property as associated object (relevant information).
 *
 * SentryID is appended to snackbar notification message.
 * @param message - Error message.
 * @param associatedObject - Error that occurred.
 */
export const handleError = (
    message: string,
    associatedObject: {} | Error | ResponseError = '',
): ReturnType<typeof addErrorSnackbar> => {
    const sentryId = sentryCapture(message, associatedObject, Severity.Error);
    return addErrorSnackbar(`${message} SentryID: ${sentryId}`);
};

/**
 * Function send error to Sentry.
 * @param message - Additional error message.
 * @param associatedObject - Error that occurred.
 */
export const logError = (message: string, associatedObject: {} | Error = ''): void => {
    sentryCapture(message, associatedObject, Severity.Error);
};

/**
 * Function send info event with data to Sentry.
 * @param message - Additional info message. SentryID is appended to the end of it.
 * @param associatedObject - Additional data.
 */
export const logInfo = (message: string, associatedObject: {}): void => {
    sentryCapture(message, associatedObject, Severity.Info);
};

/**
 * Function send info event with data to Sentry.
 * @param message - Additional info message. SentryID is appended to the end of it.
 * @param associatedObject - Additional data.
 */
export const logWarning = (message: string, associatedObject: {}): void => {
    sentryCapture(message, associatedObject, Severity.Warning);
};
