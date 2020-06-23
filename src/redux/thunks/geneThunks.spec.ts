import { MockStoreEnhanced } from 'redux-mock-store';
import { testState, generateGene, mockStore, DispatchExts } from '../../tests/mock';
import { selectGenes, pasteGenesNames } from './geneThunks';
import { genesSelected, pastedGenesFetchStarted, pastedGenesFetchEnded } from '../stores/genes';
import { RootState } from '../rootReducer';

const initialTestState = testState();

describe('gene thunk actions', () => {
    let store: MockStoreEnhanced<RootState, DispatchExts>;

    beforeEach(() => {
        store = mockStore(initialTestState);
        store.clearActions();
    });

    afterEach(() => {
        fetchMock.enableMocks();
    });

    it('dispatch select genes action', () => {
        const selectedGene = generateGene(123);

        store.dispatch(selectGenes([selectedGene]));
        // Check if correct action was called.
        expect(store.getActions()).toEqual([genesSelected([selectedGene])]);
    });

    it('get gene data (from names) and select it, not found pasted gene name must be returned', () => {
        const pastedGene = generateGene(123);
        const notFoundPastedGene = generateGene(456);

        fetchMock.mockResponse(JSON.stringify([pastedGene]));

        return store
            .dispatch(pasteGenesNames([pastedGene.name, notFoundPastedGene.name]))
            .then((notFoundGenesNames: Array<string>) => {
                // return of async actions
                expect(store.getActions()).toEqual([
                    pastedGenesFetchStarted(),
                    genesSelected([pastedGene]),
                    pastedGenesFetchEnded(),
                ]);

                expect(notFoundGenesNames).toEqual([notFoundPastedGene.name]);
            });
    });
});
