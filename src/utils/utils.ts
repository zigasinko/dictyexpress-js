/**
 * Asserts typeguard "never" to ensure exhaustive checks - e.g. switch covers all
 * types. It will trigger a compile error when a new check needs to be added to
 * cover a widened union type.
 *
 * Examples:
 * ```ts
 *   let value: 'a' | 'b';
 *
 *   if (value === 'a') {
 *   } else if (value === 'b') {
 *   } else {
 *       assertExhaustive(value);
 *   }
 *
 *   if (value === 'a') return 1;
 *   if (value === 'b') return 2;
 *   assertExhaustive(value);
 *
 *   switch (value) {
 *       case 'a': break;
 *       case 'b': break;
 *       default: assertExhaustive({value});
 *   }
 * ```
 * These examples will show a type error if type changes to 'a' | 'b' | 'c' and
 * case 'c' remains unhandled.
 */

import { forwardToSentry } from './errorUtils';

// eslint-disable-next-line import/prefer-default-export
export const assertExhaustive = (
    unexpectedValue: never | { [descriptiveKey: string]: never },
): void => {
    const errorMessage = `Value ${JSON.stringify(
        unexpectedValue,
    )} not handled despite type-exhaustive check`;
    forwardToSentry(errorMessage, new Error(errorMessage));
};
