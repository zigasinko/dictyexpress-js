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
} from '@genialis/resolwe/dist/api/types/rest';
import { BasketAddSamplesResponse } from 'redux/models/rest';
import _ from 'lodash';
import { createEpicMiddleware } from 'redux-observable';
import { AppDispatch } from 'redux/appStore';
import { generateRandomString } from 'utils/stringUtils';
import {
    RelationsById,
    GenesById,
    SamplesInfo,
    SnackbarNotifications,
    SnackbarNotification,
    SamplesExpressionsById,
    GeneSet,
    Gene,
    GeneExpression,
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

export const generateGene = (id: number): Gene => ({
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

/**
 * Helper function that generates mock instances of objects for use in unit tests.
 *
 * @param n Number of mock instances to generate.
 * @returns Instances in object, accessible by id.
 */
type InstanceById<T> = {
    [_ in string | number]: T;
};

let lastInstanceId = 0;
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
    return generateInstances<Gene>(n, (instance) => instance.name, generateGene);
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

export const testState = (): RootState => {
    return {
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
            selectedSamplesInfo: {} as SamplesInfo,
        },
        selectedGenes: {
            byId: generateGenesById(2),
            highlightedGenesNames: [],
        },
        samplesExpressions: {
            byId: {},
            isFetchingSamplesExpressions: false,
        },
        notifications: { notifications: [] as SnackbarNotifications },
    };
};

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
