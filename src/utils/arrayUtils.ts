import _ from 'lodash';

/**
 * Joins an array into "value1, value2, and value3"
 */
// eslint-disable-next-line import/prefer-default-export
export const advancedJoin = (
    values: string[],
    delimiter = ', ',
    lastDelimiter = ', and ',
): string => {
    if (_.size(values) === 0) return '';
    if (_.size(values) === 1) return values[0];
    return `${_.initial(values).join(delimiter)}${lastDelimiter}${_.last(values) as string}`;
};
