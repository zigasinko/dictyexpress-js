import { Severity } from '@sentry/browser';
import { addErrorSnackbar } from 'redux/stores/notifications';
import { AnyAction, Dispatch } from 'redux';
import { sentryCapture } from './sentryUtils';

/**
 * Function sends error to Sentry and displays alert to the user.
 * @param message - Additional error message. SentryID is appended to the end of it.
 * @param error - Error that occurred.
 * @param dispatch - Redux dispatch so "addErrorSnackbar" Redux action can be triggered.
 */
export const forwardToSentryAndNotifyUser = (
    message: string,
    error: Error,
    dispatch: Dispatch<AnyAction>,
): void => {
    const sentryId = sentryCapture(message, error, Severity.Error);
    dispatch(addErrorSnackbar(`${message} SentryID: ${sentryId}`));
};

/**
 * Function send error to Sentry.
 * @param message - Additional error message. SentryID is appended to the end of it.
 * @param error - Error that occurred.
 */
export const forwardToSentry = (message: string, error: Error): void => {
    sentryCapture(message, error, Severity.Error);
};
