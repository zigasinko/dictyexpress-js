import { Severity } from '@sentry/browser';
import { sentryCapture } from './sentryUtils';
import { AppDispatch } from '../redux/rootStore';
import { addErrorSnackbar } from '../redux/stores/notifications';

/**
 * Function send error to Sentry and displays alert to the user.
 * @param message - Additional error message. SentryID is appended to the end of it.
 * @param error - Error that occurred.
 * @param dispatch - Redux dispatch so "addErrorSnackbar" Redux action can be triggered.
 */
// eslint-disable-next-line import/prefer-default-export
export const forwardToSentryAndNotifyUser = (
    message: string,
    error: Error,
    dispatch: AppDispatch,
): void => {
    const sentryId = sentryCapture(message, error, Severity.Error);
    dispatch(addErrorSnackbar(`${message} SentryID: ${sentryId}`));
};
