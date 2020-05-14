import LZString from 'lz-string';
import { dateTimeReviver } from './dateTimeUtils';

export const getLocalStorageKey = (key: string): string => {
    return `genexpress_${key}`;
};

export const writeToLocalStorage = (key: string, value: unknown): void => {
    const stringifiedObject = typeof value === 'object' ? JSON.stringify(value) : `${value}`;
    return localStorage.setItem(getLocalStorageKey(key), LZString.compress(stringifiedObject));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const readFromLocalStorage = (key: string): any => {
    const zippedString = localStorage.getItem(getLocalStorageKey(key));
    if (zippedString == null || zippedString === '') {
        return null;
    }

    const unzippedString = LZString.decompress(zippedString);

    if (unzippedString == null) {
        return null;
    }

    return JSON.parse(unzippedString, dateTimeReviver);
};

export const deleteFromLocalStorage = (key: string): void => {
    localStorage.removeItem(key);
};
