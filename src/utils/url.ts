/**
 * Updates a given query parameter and returns a new URL.
 *
 * @param uri URL to update
 * @param key Query parameter name
 * @param value Query parameter value
 * @return Updated URL
 */
// eslint-disable-next-line import/prefer-default-export
export const updateUrlParameter = (originalUri: string, key: string, value: string): string => {
    // Adapted from https://gist.github.com/niyazpk/f8ac616f181f6042d1e0#gistcomment-1743025.

    let uri: string = originalUri;

    // Remove the hash part before operating on the URI.
    const i = uri.indexOf('#');
    const hash = i === -1 ? '' : uri.substr(i);
    uri = i === -1 ? uri : uri.substr(0, i);

    const re = new RegExp(`([?&])${key}=.*?(&|$)`, 'i');
    const separator = uri.includes('?') ? '&' : '?';

    if (!value) {
        // Remove key-value pair if value is empty.
        uri = uri.replace(new RegExp(`([?&]?)${key}=[^&]*`, 'i'), '');
        if (uri.endsWith('?')) {
            uri = uri.slice(0, -1);
        }

        // Replace first occurrence of & by ? if no ? is present.
        if (!uri.includes('?')) uri = uri.replace(/&/, '?');
    } else if (re.exec(uri)) {
        uri = uri.replace(re, `$1${key}=${value}$2`);
    } else {
        uri = `${uri + separator + key}=${value}`;
    }

    return uri + hash;
};
