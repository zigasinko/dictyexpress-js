import _ from 'lodash';

/**
 * Calculates logarithm of given base.
 */
export const logOfBase = (value: number, base: number): number => {
    if (value === null) return NaN;
    return Math.log(value) / Math.log(base);
};

/**
 * Arithmetic mean of the provided array. Forgiving with blank values (null, NaN, undefined).
 * simply ignores them both from the sum and the length.
 *
 * @param values An array containing sample data
 */
export const mean = (values: number[]): number => {
    const finiteArray = values.filter((value) => _.isFinite(value));
    return finiteArray.length > 0 ? _.sum(finiteArray) / finiteArray.length : NaN;
};

/**
 * Returns minimum and maximum value from array.
 * @param values An array with numberic values
 */
export const getMinMax = (values: number[]): [number, number] => {
    const min = Math.min(...values);
    const max = Math.max(...values);

    return [min, max];
};
