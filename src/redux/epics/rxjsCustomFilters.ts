import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

const inputIsNotNullOrUndefined = <T>(input: null | undefined | T): input is T => {
    return input !== null && input !== undefined;
};

/**
 * TypeScript doesn't know how to correctly infer type with filter operator:
 * - https://github.com/Microsoft/TypeScript/issues/10734
 * - https://github.com/Microsoft/TypeScript/issues/16069.
 *
 * That's why this custom operator is used instead.
 */
// eslint-disable-next-line import/prefer-default-export
export const filterNullAndUndefined = <T>() => {
    return (source$: Observable<null | undefined | T>): Observable<T> =>
        source$.pipe(filter(inputIsNotNullOrUndefined));
};
