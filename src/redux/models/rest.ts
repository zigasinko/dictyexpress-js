export type BasketAddSamplesResponse = {
    id: string;
    modified: string;
    ignored: number[];
    permitted_organisms: string[];
    permitted_sources: string[];
    conflict_organisms: string[];
    conflict_sources: string[];
};
