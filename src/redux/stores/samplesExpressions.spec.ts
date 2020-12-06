import { generateSamplesExpressionsById } from 'tests/mock';
import samplesExpressionsReducer, {
    SamplesExpressionsState,
    samplesExpressionsFetchSucceeded,
} from './samplesExpressions';

const samplesExpressionsById = generateSamplesExpressionsById(2, []);

describe('samplesExpressions store', () => {
    let initialState: SamplesExpressionsState;
    beforeEach(() => {
        initialState = {
            byId: {},
            isFetchingSamplesExpressions: false,
        };
    });

    it('should add fetched samplesExpressions to state with samplesExpressionsFetchSucceeded action', () => {
        const newState = samplesExpressionsReducer(
            initialState,
            samplesExpressionsFetchSucceeded(samplesExpressionsById),
        );
        const expectedState = {
            ...initialState,
            byId: samplesExpressionsById,
        };

        expect(newState).toEqual(expectedState);
    });
});
