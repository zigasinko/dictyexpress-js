import { ResponseError } from 'redux/models/internal';
import { addErrorSnackbar } from 'redux/stores/notifications';
import { sentryCapture } from './sentryUtils';

export const handleError = (
    message: string,
    associatedObject: Record<string, unknown> | Error | ResponseError = {},
): ReturnType<typeof addErrorSnackbar> => {
    const sentryId = sentryCapture(message, associatedObject, 'error');
    return addErrorSnackbar(`${message} SentryID: ${sentryId}`);
};

export const logError = (
    message: string,
    associatedObject: Record<string, unknown> | Error = {},
): void => {
    sentryCapture(message, associatedObject, 'error');
};

export const logInfo = (message: string, associatedObject: Record<string, unknown>): void => {
    sentryCapture(message, associatedObject, 'info');
};

export const logWarning = (message: string, associatedObject: Record<string, unknown>): void => {
    sentryCapture(message, associatedObject, 'warning');
};
