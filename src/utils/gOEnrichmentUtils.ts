/* eslint-disable no-param-reassign */
import { GOEnrichmentJson } from '@genialis/resolwe/dist/api/types/rest';
import _ from 'lodash';
import { AspectValue, EnhancedGOEnrichmentJson, GOEnrichmentRow } from 'redux/models/internal';

export const appendMissingAttributesToJson = (
    json: EnhancedGOEnrichmentJson,
    source: string,
    species: string,
): void => {
    const walk = (
        items: GOEnrichmentRow[] | undefined,
        fn: (item: GOEnrichmentRow, depth: number) => void,
        depth = 0,
    ): void => {
        _.each(items, (item) => {
            fn(item, depth);
            walk(item.children, fn, depth + 1);
        });
    };

    _.each(json.tree, (aspectRows) => {
        let maxScore = -1;
        walk(aspectRows, (item) => {
            maxScore = Math.max(item.score, maxScore);
        });

        walk(aspectRows, (item, depth) => {
            item.depth = depth;
            item.source = source;
            item.species = species;
            item.score_percentage = (item.score * 100) / maxScore;
            item.gene_associations = json.gene_associations[item.term_id];
            item.collapsed = false;
        });
    });
};

export const flattenGoEnrichmentTree = (
    items: GOEnrichmentRow[] | undefined,
    path: string[],
    disableCollapseCheck = false,
): GOEnrichmentRow[] => {
    return _.flatten(
        _.map(items, (item) => {
            const itemPath = [...path, item.term_name];
            return [
                { ...item, path: itemPath },
                ...flattenGoEnrichmentTree(
                    !disableCollapseCheck && item.collapsed ? undefined : item.children,
                    [...itemPath],
                    disableCollapseCheck,
                ),
            ];
        }),
    );
};

/**
 * Filter and flatten tree into rows (array of all nodes).
 */
export const ontologyJsonToOntologyRows = (
    gOEnrichmentJson: GOEnrichmentJson,
    aspect: AspectValue,
    disableCollapseCheck = false,
): GOEnrichmentRow[] => {
    if (!gOEnrichmentJson) return [];

    const filterByAspect = (json: GOEnrichmentJson): GOEnrichmentRow[] => {
        return json.tree[aspect] as GOEnrichmentRow[];
    };

    return flattenGoEnrichmentTree(filterByAspect(gOEnrichmentJson), [], disableCollapseCheck);
};
