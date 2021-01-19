import { Severity } from '@sentry/browser';
import { ResponseError } from 'redux/models/internal';
import { addErrorSnackbar } from 'redux/stores/notifications';
import { sentryCapture } from './sentryUtils';

export const handleError = (
    message: string,
    associatedObject: {} | Error | ResponseError = '',
): ReturnType<typeof addErrorSnackbar> => {
    const sentryId = sentryCapture(message, associatedObject, Severity.Error);
    return addErrorSnackbar(`${message} SentryID: ${sentryId}`);
};

export const logError = (message: string, associatedObject: {} | Error = ''): void => {
    sentryCapture(message, associatedObject, Severity.Error);
};

export const logInfo = (message: string, associatedObject: {}): void => {
    sentryCapture(message, associatedObject, Severity.Info);
};

export const logWarning = (message: string, associatedObject: {}): void => {
    sentryCapture(message, associatedObject, Severity.Warning);
};
