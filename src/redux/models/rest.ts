export type BasketAddSamplesResponse = {
    id: string;
    modified: string;
    ignored: number[];
    permitted_organisms: string[];
    permitted_sources: string[];
    conflict_organisms: string[];
    conflict_sources: string[];
};

/**
 * Process statuses.
 */
export const STATUS = {
    UPLOADING: 'UP',
    RESOLVING: 'RE',
    WAITING: 'WT',
    PREPARING: 'PP',
    PROCESSING: 'PR',
    DONE: 'OK',
    ERROR: 'ER',
    DIRTY: 'DR',
    NO_STATUS: 'NO',
};
