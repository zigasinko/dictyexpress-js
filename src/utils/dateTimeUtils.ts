const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

// eslint-disable-next-line import/prefer-default-export
export const dateTimeReviver = (key: string, value: unknown): unknown => {
    if (typeof value === 'string' && dateFormat.test(value)) {
        return new Date(value);
    }

    return value;
};
