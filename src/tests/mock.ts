import configureMockStore, { MockStoreEnhanced } from 'redux-mock-store';
import {
    Relation,
    Contributor,
    ItemPermissionsOf,
    CollectionPermissions,
    Collection,
    DescriptorSchema,
    RelationPartition,
    User,
    DataGafAnnotation,
    Data,
    DONE_DATA_STATUS,
    Process,
} from '@genialis/resolwe/dist/api/types/rest';
import { BasketAddSamplesResponse } from 'redux/models/rest';
import _ from 'lodash';
import { createEpicMiddleware } from 'redux-observable';
import { AppDispatch } from 'redux/appStore';
import { generateRandomString, generateRandomStrings } from 'utils/stringUtils';
import { generateRandomNumbers } from 'utils/numberUtils';
import {
    RelationsById,
    GenesById,
    BasketInfo,
    SnackbarNotifications,
    SnackbarNotification,
    SamplesExpressionsById,
    GeneSet,
    Gene,
    GeneExpression,
    VolcanoPoint,
    DifferentialExpression,
    DifferentialExpressionsById,
} from '../redux/models/internal';
import { RootState } from '../redux/rootReducer';

const getDateISOString = (): string => new Date().toISOString();

export const generateContributor = (id: number): Contributor => ({
    id,
    first_name: 'Janez',
    last_name: 'Novak',
    username: 'janeznovak',
});

export const generateDescriptorSchema = (id: number): DescriptorSchema => ({
    id,
    created: getDateISOString(),
    modified: getDateISOString(),
    current_user_permissions: [
        {
            type: 'user',
            permissions: ['view'],
        },
        {
            type: 'group',
            permissions: ['edit'],
        },
    ],
    slug: `testDescriptorSchema-${id}`,
    name: `Test descriptor schema ${id}`,
    version: '1.0',
    schema: [],
    contributor: generateContributor(1),
});

export const generateCollection = (id: number): Collection => ({
    id,
    created: getDateISOString(),
    modified: getDateISOString(),
    duplicated: 'No',
    slug: `testCollection-${id}`,
    name: `Test collection ${id}`,
    description: 'Collection description',
    descriptor: {},
    descriptor_schema: generateDescriptorSchema(3),
    contributor: generateContributor(1),
    current_user_permissions: [] as ItemPermissionsOf<CollectionPermissions>[],
    tags: ['community:bcm'],
    settings: {},
    entity_count: 2,
    data_count: 3,
    status: 'OK',
});

export const generateSingleTimeSeries = (id: number): Relation => ({
    id,
    created: getDateISOString(),
    modified: getDateISOString(),
    contributor: generateContributor(1),
    type: 'series',
    collection: generateCollection(id),
    category: 'Time series',
    partitions: [{ id: 1, position: 1, entity: 1, label: 'Test label' }],
    unit: null,
});

export const generateGene = (id: number | string): Gene => ({
    feature_id: id.toString(),
    aliases: [`TestGene${id}_alias1`, `TestGene${id}_alias2`],
    name: `TestGene${id}`,
    full_name: `Test gene ${id}`,
    description: 'This is a test gene',
    source: 'ENSEMBL',
    species: 'Homo sapiens',
});

export const generateNotification = (key: string | number): SnackbarNotification => ({
    key,
    message: 'Test message',
    variant: 'info',
});

export const generateBasket = (id: string): BasketAddSamplesResponse => ({
    id,
    modified: getDateISOString(),
    conflict_organisms: [],
    conflict_sources: [],
    ignored: [],
    permitted_organisms: ['Homo sapiens'],
    permitted_sources: ['UCSC'],
});

export const generateGeneExpression = (geneId: number): GeneExpression => ({
    [geneId.toString()]: new Date().getTime(),
});

const generateDataDifferentialExpression = (): { file: string; size: number } => ({
    file: `${generateRandomString(5)}.tab.gz`,
    size: 1234,
});

export const generateDifferentialExpressionJson = (
    numberOfGenes = 10,
): {
    fdr: number[];
    gene_id: string[];
    logfc: number[];
    pvalue: number[];
    stat: number[];
} => ({
    fdr: generateRandomNumbers(numberOfGenes, () => Math.random() * 10),
    gene_id: generateRandomStrings(numberOfGenes, 8),
    logfc: generateRandomNumbers(numberOfGenes, () => Math.random() * 10),
    pvalue: generateRandomNumbers(numberOfGenes, () => Math.random() * 10),
    stat: generateRandomNumbers(numberOfGenes, () => Math.random() * 10),
});

export const generateDifferentialExpression = (id: number): DifferentialExpression => ({
    id,
    name: `TestDifferentialExpression${id}`,
    status: 'OK',
    started: getDateISOString(),
    finished: getDateISOString(),
    process_progress: 100,
    logfc_threshold: 1,
    // Has to be the same as property in differentialExpressionJson.
    prob_field: 'fdr',
    prob_threshold: 0.05,
    up_regulated: 5,
    down_regulated: 5,
    output: {
        de_json: 1,
        de_file: generateDataDifferentialExpression(),
        raw: generateDataDifferentialExpression(),
        source: 'DICTYBASE',
        species: 'Dictyostelium discoideum',
    },
    slug: `testDifferentialExpression${id}`,
});

export const generateVolcanoPoint = (geneId: number): VolcanoPoint => ({
    geneId: geneId.toString(),
    logFcValue: Math.random(),
    logProbFiniteValue: Math.random(),
    logProbValue: Math.random(),
    probValue: Math.random(),
});

export const generateVolcanoPoints = (n: number): VolcanoPoint[] => {
    return _.times(n, (i) => {
        return generateVolcanoPoint(i + 1);
    });
};

export const generateGeneSet = (): GeneSet => ({
    dateTime: new Date(Math.random() * 1000000000000),
    genesNames: [generateRandomString(3), generateRandomString(3), generateRandomString(3)],
});

export const generateGeneSets = (n: number): GeneSet[] => {
    return _.times(n, () => {
        return generateGeneSet();
    });
};

export const generatePartition = (id: number, entityId: number): RelationPartition => ({
    id,
    entity: entityId,
    position: 0,
    label: `${id}Hr`,
});

export const generateUser = (id: number): User => ({
    id,
    username: 'testUser',
    email: 'test@mail.com',
    first_name: 'Test',
    last_name: 'User',
    job_title: 'Developer',
    company: 'Genialis',
    department: 'Software development',
    location: 'Ljubljana',
    lab: 'Bio',
    phone_number: '031123456',
    last_login: getDateISOString(),
    date_joined: getDateISOString(),
});

const generateProcess = (id: number): Process => ({
    id: 1,
    slug: 'clustering-hierarchical-samples',
    name: 'Hierarchical clustering of samples',
    created: getDateISOString(),
    modified: getDateISOString(),
    version: '2.0.0',
    type: 'data:clustering:hierarchical:sample:',
    category: 'Analyses:',
    persistence: 'TMP',
    description: 'Hierarchical clustering of samples.',
    input_schema: [
        {
            name: 'processing',
            group: [
                {
                    default: 'spearman',
                    label: 'Distance metric',
                    type: 'basic:string:',
                    name: 'distance_metric',
                    choices: [
                        {
                            value: 'spearman',
                            label: 'spearman',
                        },
                        {
                            value: 'pearson',
                            label: 'pearson',
                        },
                        {
                            value: 'euclidean',
                            label: 'euclidean',
                        },
                    ],
                },
                {
                    default: 'average',
                    label: 'Linkage method',
                    type: 'basic:string:',
                    name: 'linkage_method',
                    choices: [
                        {
                            value: 'average',
                            label: 'average',
                        },
                        {
                            value: 'single',
                            label: 'single',
                        },
                        {
                            value: 'complete',
                            label: 'complete',
                        },
                    ],
                },
            ],
        },
    ],
    output_schema: null,
    run: null,
    contributor: generateContributor(id),
    current_user_permissions: [],
    is_active: true,
    data_name: '',
    entity_descriptor_schema: undefined,
    entity_input: '',
    entity_type: undefined,
    scheduling_class: 'BA',
    entity_always_create: true,
});

export const generateData = (id: number): Data => ({
    id,
    created: getDateISOString(),
    modified: getDateISOString(),
    contributor: {
        id: 1,
        first_name: '',
        last_name: '',
        username: '',
    },
    current_user_permissions: [],
    started: getDateISOString(),
    finished: getDateISOString(),
    scheduled: getDateISOString(),
    duplicated: undefined,
    checksum: '',
    status: DONE_DATA_STATUS,
    process_progress: 100,
    process_rc: 0,
    size: 123,
    process_memory: 123,
    process_cores: 2,
    process_info: [],
    process_warning: [],
    process_error: [],
    process: generateProcess(id),
    output: {},
    slug: `test-data-${id}`,
    name: `Test Data ${id}`,
    descriptor_schema: {
        id: 1,
        slug: 'test-schema',
        name: 'Test Schema',
        version: '1.0.0',
        contributor: generateContributor(id),
        schema: [],
        created: getDateISOString(),
        modified: getDateISOString(),
    },
    descriptor: {},
    input: {},
    tags: [],
    entity: undefined,
    collection: undefined,
});

export const generateGaf = (
    id: number,
): {
    humanGaf: DataGafAnnotation;
    mouseMGIGaf: DataGafAnnotation;
    mouseUCSCGaf: DataGafAnnotation;
} => {
    const humanGaf = {
        ...generateData(id),
        name: 'Human gaf',
        slug: 'human-gaf',
        output: {
            source: 'UniProtKB',
            species: 'Homo sapiens',
            gaf: {
                file: 'goa_human.gaf.txt.gz',
                size: 1231231,
            },
            gaf_obj: {
                file: 'gaf_obj',
                size: 1231231,
            },
        },
    };

    const mouseMGIGaf = {
        ...generateData(id),
        name: 'Mouse MGI gaf',
        slug: 'mouse-mgi-gaf',
        output: {
            source: 'MGI',
            species: 'Mus musculus',
            gaf: {
                file: 'gene_association.mgi.txt.gz',
                size: 1231231,
            },
            gaf_obj: {
                file: 'gaf_obj',
                size: 1231231,
            },
        },
    };

    const mouseUCSCGaf = {
        ...generateData(id),
        name: 'Mouse UCSC gaf',
        slug: 'mouse-ucsc-gaf',
        output: {
            source: 'UCSC',
            species: 'Mus musculus',
            gaf: {
                file: 'gene_association.mgi.txt.gz',
                size: 1231231,
            },
            gaf_obj: {
                file: 'gaf_obj',
                size: 1231231,
            },
        },
    };

    return { humanGaf, mouseMGIGaf, mouseUCSCGaf };
};

/**
 * Helper function that generates mock instances of objects for use in unit tests.
 *
 * @param n Number of mock instances to generate.
 * @returns Instances in object, accessible by id.
 */
type InstanceById<T> = {
    [_ in string | number]: T;
};

let lastInstanceId = 1;
export const generateInstances = <T>(
    n: number,
    getId: (instance: T) => string | number,
    generateSingleInstance: (id: number) => T,
): InstanceById<T> => {
    const instancesById = {} as InstanceById<T>;

    for (let i = lastInstanceId; i < lastInstanceId + n; i += 1) {
        const instance = generateSingleInstance(i);
        instancesById[getId(instance)] = instance;
    }

    lastInstanceId += n;

    return instancesById;
};

export const generateTimeSeriesById = (n: number): RelationsById => {
    return generateInstances<Relation>(n, (instance) => instance.id, generateSingleTimeSeries);
};

export const generateGenesById = (n: number): GenesById => {
    return generateInstances<Gene>(n, (instance) => instance.feature_id, generateGene);
};

export const generateGenesByIdPredefinedIds = (genesIds: string[]): GenesById => {
    return _.keyBy(
        genesIds.map((geneId) => generateGene(geneId)),
        'feature_id',
    );
};

export const generateRelationsById = (n: number): RelationsById => {
    return generateInstances<Relation>(n, (instance) => instance.id, generateSingleTimeSeries);
};

export const generateSamplesExpressionsById = (n: number): SamplesExpressionsById => {
    return generateInstances<GeneExpression>(
        n,
        (instance) => Object.keys(instance)[0],
        generateGeneExpression,
    );
};

export const generateDifferentialExpressionsById = (n: number): DifferentialExpressionsById => {
    return generateInstances<DifferentialExpression>(
        n,
        (instance) => instance.id,
        generateDifferentialExpression,
    );
};

export const testState = (): RootState => ({
    authentication: {
        user: generateUser(2),
        isLoggedIn: true,
        isLoggingIn: false,
        isLoggingOut: false,
        isFetchingUser: false,
    },
    timeSeries: {
        byId: generateTimeSeriesById(2),
        selectedId: 1,
        isFetching: false,
        isAddingToBasket: false,
        basketInfo: {} as BasketInfo,
    },
    genes: {
        byId: generateGenesById(2),
        selectedGenesIds: [],
        highlightedGenesIds: [],
        isFetchingDifferentialExpressionGenes: false,
        isFetchingAssociationsGenes: false,
    },
    samplesExpressions: {
        byId: {},
        isFetchingSamplesExpressions: false,
    },
    differentialExpressions: {
        byId: {},
        isFetchingDifferentialExpressions: false,
        isFetchingDifferentialExpressionsData: false,
        selectedId: 0,
    },
    gOEnrichment: {
        json: {
            gene_associations: {},
            total_genes: 0,
            tree: {},
        },
        gaf: generateGaf(1).humanGaf,
        source: '',
        species: '',
        pValueThreshold: 0.1,
        isFetchingJson: false,
    },
    notifications: { notifications: [] as SnackbarNotifications },
});

export const mockStore = (
    initialTestState: RootState,
): MockStoreEnhanced<RootState, AppDispatch> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const epicMiddleware = createEpicMiddleware<any, any, RootState, any>();

    const createMockStore = configureMockStore<RootState, AppDispatch>([epicMiddleware]);
    const store = createMockStore(initialTestState);
    store.clearActions();

    return store;
};
